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

    // Set up reconnect handler to clear stale state
    this.wsManager.network = this
    this.wsManager.network.onReconnect = () => this.onReconnect()
    this.wsManager.init(wsUrl, name, avatar)
  }

  onReconnect() {
    // Clear stale queue entries accumulated during disconnection
    if (this.queue.length > 0) {
      logger.warn('Clearing stale queue entries on reconnect', { count: this.queue.length })
      this.queue = []
    }
    logger.info('Client reconnected, requesting full snapshot')
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
    if (onAck) {
      promise.then(onAck).catch(err => {
        logger.error('SendReliable promise rejected', { method, error: err.message })
      })
    }
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

    logger.info('Packet method received', { method })

    // Handle compression envelope (whether compressed or not)
    let finalData = data
    const hasCompressionEnvelope = data && typeof data === 'object' && typeof data.compressed === 'boolean'

    if (hasCompressionEnvelope) {
      if (data.compressed) {
        logger.info('Decompressing packet', { method })
        try {
          finalData = this.compressor.decompress(data)
          logger.info('Decompression successful', { method, dataKeys: finalData && typeof finalData === 'object' ? Object.keys(finalData).slice(0, 10) : typeof finalData })
        } catch (err) {
          logger.error('Failed to decompress packet data', {
            method,
            error: err.message,
          })
          if (data.data && typeof data.data === 'object') {
            logger.info('Falling back to uncompressed data')
            finalData = data.data
          } else {
            return
          }
        }
      } else {
        // Uncompressed but still wrapped in envelope - unwrap it
        finalData = data.data
        logger.info('Unwrapped uncompressed envelope', {
          method,
          dataType: typeof finalData,
          dataKeys: finalData && typeof finalData === 'object' ? Object.keys(finalData).slice(0, 10) : 'not-object'
        })
      }
    }

    this.enqueue(method, finalData)
  }

  onSnapshot(data) {
    // Handle two types of snapshot packets:
    // 1. Full snapshot (initial connection): has collections, settings, blueprints, entities, etc.
    // 2. Frame update (periodic): has only time and frame for synchronization

    const isFullSnapshot = data.collections || data.entities || data.blueprints
    const isFrameUpdate = data.time !== undefined && data.frame !== undefined && !isFullSnapshot

    if (isFrameUpdate) {
      // Just a frame sync update, update server time offset only
      if (data.time !== undefined) {
        this.serverTimeOffset = data.time - performance.now()
      }
      return
    }

    // Handle full snapshot
    if (!isFullSnapshot) {
      logger.warn('Snapshot packet missing expected data', {
        hasCollections: !!data.collections,
        hasEntities: !!data.entities,
        hasBlueprints: !!data.blueprints,
        hasTime: data.time !== undefined,
        hasFrame: data.frame !== undefined,
        dataKeys: data && typeof data === 'object' ? Object.keys(data) : 'not-object',
      })
      return
    }

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

    logger.info('Full snapshot received', { id: this.id })
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
    if (!entity) {
      logger.error('onEntityModified: entity not found', { id: data.id })
      return
    }
    try {
      entity.modify(data)
    } catch (err) {
      logger.error('Error modifying entity', { id: data.id, error: err.message })
    }
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
    if (typeof id !== 'string' || typeof version !== 'number' || typeof name !== 'string') {
      logger.warn('Invalid onEntityEvent types', {
        idType: typeof id,
        versionType: typeof version,
        nameType: typeof name,
      })
      return
    }
    const entity = this.world.entities.get(id)
    if (!entity) {
      logger.warn('onEntityEvent: entity not found', { id })
      return
    }
    try {
      entity.onEvent(version, name, data)
    } catch (err) {
      logger.error('Error processing entity event', { id, name, error: err.message })
    }
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
