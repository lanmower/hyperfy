import { uuid } from '../utils.js'
import { hashFile } from '../utils-client.js'
import { BaseNetwork } from '../network/BaseNetwork.js'
import { clientNetworkHandlers } from '../config/HandlerRegistry.js'
import { NetworkCore } from '../network/NetworkCore.js'
import { WebSocketManager } from './network/WebSocketManager.js'
import { SnapshotProcessor } from './network/SnapshotProcessor.js'
import { ClientPacketHandlers } from './network/ClientPacketHandlers.js'
import { MessageHandler } from '../plugins/core/MessageHandler.js'
import { storage } from '../storage.js'
import { Compressor } from './network/Compressor.js'
import { clientTimeoutManager } from './network/TimeoutManager.js'
import { StructuredLogger } from '../utils/logging/index.js'
import { TimeoutConfig } from '../config/TimeoutConfig.js'
import { readPacket } from '../packets.js'

const logger = new StructuredLogger('ClientNetwork')

export class ClientNetwork extends BaseNetwork {
  static DEPS = {
    loader: 'loader',
    entities: 'entities',
    chat: 'chat',
    settings: 'settings',
    livekit: 'livekit',
    events: 'events',
    blueprints: 'blueprints',
    environment: 'environment',
    stats: 'stats',
    collections: 'collections',
  }

  constructor(world) {
    super(world, clientNetworkHandlers)
    this.apiUrl = null
    this.id = null
    this.isClient = true
    this.serverTimeOffset = 0
    this.protocol.isClient = true
    this.protocol.flushTarget = this
    this.assetsUrl = world.assetsUrl
    this.compressor = new Compressor()
    this.core = new NetworkCore()
    this.wsManager = new WebSocketManager(this)
    this.snapshotProcessor = new SnapshotProcessor(this)
    this.packetHandlers = new ClientPacketHandlers(this)
    this.offlineMode = false
    this.lastKnownState = null
    this.timeoutManager = clientTimeoutManager
    this.queue = []
  }

  init({ wsUrl, name, avatar }) {
    logger.info('ClientNetwork.init called', { wsUrl, name, avatar })
    if (!wsUrl) {
      logger.warn('No WebSocket URL provided, running in offline mode', {})
      this.offlineMode = true
      return
    }

    this.wsManager.init(wsUrl, name, avatar)
  }

  preFixedUpdate() {
    this.flush()
  }

  send(method, data) {
    if (this.offlineMode) return
    this.protocol.send(this.wsManager, method, data)
  }

  sendReliable(method, data, onAck) {
    if (this.offlineMode) {
      onAck?.()
      return Promise.resolve()
    }
    const promise = this.protocol.sendReliable(this.wsManager, method, data)
    if (onAck) promise.then(onAck)
    return promise
  }

  async uploadFile(file, type) {
    const hash = await hashFile(file)
    const isNew = !await this.checkHash(hash)

    if (isNew) {
      const toBuffer = buf => Buffer.from(buf)
      const data = new FormData()
      data.append('file', file)
      data.append('hash', hash)
      data.append('type', type)

      const response = await fetch(`${this.apiUrl}/upload`, {
        method: 'POST',
        body: data,
      })

      if (!response.ok) {
        logger.error('Upload failed', { status: response.status, statusText: response.statusText })
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
      }
    }

    return hash
  }

  async checkHash(hash) {
    try {
      const response = await fetch(`${this.apiUrl}/hash/${hash}`)
      return response.ok
    } catch (err) {
      logger.error('Check hash failed', { error: err.message })
      return false
    }
  }

  simulateLag(amount) {
    this.wsManager.simulateLag(amount)
  }

  setServerTime(t) {
    this.serverTimeOffset = performance.now() - t
    logger.info('Server time synchronized', { offset: this.serverTimeOffset })
  }

  getTime() {
    return performance.now() - this.serverTimeOffset
  }

  enqueue(method, data) {
    this.queue.push([method, data])
  }

  flush() {
    while (this.queue.length) {
      let method, data
      try {
        const entry = this.queue.shift()
        if (!Array.isArray(entry) || entry.length < 2) {
          logger.warn('Invalid queue entry dropped', {
            entryType: typeof entry,
            isArray: Array.isArray(entry),
            length: entry?.length,
            entry: entry && typeof entry === 'object' ? Object.keys(entry).slice(0, 5) : String(entry).slice(0, 100),
          })
          continue
        }
        ;[method, data] = entry
        if (!method) {
          logger.warn('Empty method in queue entry', { data })
          continue
        }
        const handler = this[method]
        if (typeof handler !== 'function') {
          logger.warn('Handler not found or not a function', {
            method,
            handlerType: typeof handler,
          })
          continue
        }
        handler.call(this, data)
      } catch (err) {
        logger.error('Error flushing queue', {
          method,
          error: err.message,
          errorType: err.name,
          dataType: typeof data,
          dataKeys: data && typeof data === 'object' ? Object.keys(data).slice(0, 10) : undefined,
        })
      }
    }
  }

  onPacket = e => {
    const [method, data] = readPacket(e.data)
    if (!method) {
      logger.error('Invalid packet received')
      return
    }

    // Decompress data if compressed
    let finalData = data
    const isCompressed = data && typeof data === 'object' && data.compressed === true
    if (isCompressed) {
      logger.info('Decompressing packet', { method, compressed: data.compressed })
      try {
        finalData = this.compressor.decompress(data)
        logger.info('Decompression successful', { method })
      } catch (err) {
        logger.error('Failed to decompress packet data', {
          method,
          error: err.message,
        })
        return
      }
    } else if (method === 'onSnapshot') {
      // Log snapshot packet details for debugging
      logger.debug('Snapshot packet received', {
        hasCompressed: data?.hasOwnProperty('compressed'),
        compressedValue: data?.compressed,
        dataKeys: data && typeof data === 'object' ? Object.keys(data).slice(0, 10) : 'not-object',
        dataType: typeof data,
      })
    }

    this.enqueue(method, finalData)
  }

  onSnapshot(data) {
    this.id = data.id
    this.serverTimeOffset = data.serverTime - performance.now()
    this.apiUrl = data.apiUrl
    this.maxUploadSize = data.maxUploadSize
    this.world.assetsUrl = data.assetsUrl

    if (data.settings && data.settings.avatar) {
      this.world.loader.preload('avatar', data.settings.avatar.url)
    }

    for (const item of data.blueprints || []) {
      if (item.preload && !item.disabled) {
        if (item.model) {
          const type = item.model.endsWith('.vrm') ? 'avatar' : 'model'
          this.world.loader.preload(type, item.model)
        }
        if (item.script) {
          this.world.loader.preload('script', item.script)
        }
        for (const value of Object.values(item.props || {})) {
          if (value === undefined || value === null || !value?.url || !value?.type) continue
          this.world.loader.preload(value.type, value.url)
        }
      }
    }

    for (const item of data.entities || []) {
      if (item.type === 'player' && item.owner === this.id) {
        const url = item.sessionAvatar || item.avatar
        this.world.loader.preload('avatar', url)
      }
    }

    if (this.world.loader && this.world.loader.execPreload) {
      this.world.loader.execPreload()
    }

    this.world.collections.deserialize(data.collections)
    this.world.settings.deserialize(data.settings)
    this.world.settings.setHasAdminCode(data.hasAdminCode)
    this.world.chat.deserialize(data.chat)
    this.world.blueprints.deserialize(data.blueprints)
    this.world.entities.deserialize(data.entities)
    this.world.livekit?.deserialize(data.livekit)
    storage.set('authToken', data.authToken)

    logger.info('Snapshot received', { id: this.id })
  }

  onSettingsModified = data => {
    this.world.settings.set(data.key, data.value)
  }

  onChatAdded = msg => {
    this.world.chat.add(msg, false)
  }

  onChatCleared = () => {
    this.world.chat.clear()
  }

  onBlueprintAdded = blueprint => {
    this.world.blueprints.add(blueprint)
  }

  onBlueprintModified = change => {
    this.world.blueprints.modify(change)
  }

  onEntityAdded = data => {
    this.world.entities.add(data)
  }

  onEntityModified = data => {
    const entity = this.world.entities.get(data.id)
    if (!entity) return logger.error('onEntityModified: no entity found', { id: data.id })
    entity.modify(data)
  }

  onEntityEvent = event => {
    if (!Array.isArray(event) || event.length < 4) {
      logger.warn('Invalid onEntityEvent data', {
        isArray: Array.isArray(event),
        length: event?.length,
      })
      return
    }
    const [id, version, name, data] = event
    const entity = this.world.entities.get(id)
    entity?.onEvent(version, name, data)
  }

  onEntityRemoved = id => {
    this.world.entities.remove(id)
  }

  onPlayerTeleport = data => {
    this.world.entities.player?.teleport(data)
  }

  onPlayerPush = data => {
    this.world.entities.player?.push(data.force)
  }

  onPlayerSessionAvatar = data => {
    this.world.entities.player?.setSessionAvatar(data.avatar)
  }

  onLiveKitLevel = data => {
    this.world.livekit.setLevel(data.playerId, data.level)
  }

  onMute = data => {
    this.world.livekit.setMuted(data.playerId, data.muted)
  }

  onPong = time => {
    this.world.stats?.onPong(time)
  }

  onKick = code => {
    this.world.emit('kick', code)
  }

  onClose = code => {
    this.world.chat.add({
      id: uuid(),
      from: null,
      fromId: null,
      body: 'You have been disconnected.',
      createdAt: moment().toISOString(),
    })
    this.world.emit('disconnect', code || true)
    logger.info('Disconnected', { code })
  }

  destroy() {
    this.wsManager.disconnect()
    this.core = null
  }
}
