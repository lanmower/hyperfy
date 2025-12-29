import moment from 'moment'
import { uuid } from '../utils.js'
import { hashFile } from '../utils-client.js'
import { BaseNetwork } from '../network/BaseNetwork.js'
import { clientNetworkHandlers } from '../config/HandlerRegistry.js'
import { WebSocketManager } from './network/WebSocketManager.js'
import { SnapshotProcessor } from './network/SnapshotProcessor.js'
import { ClientPacketHandlers } from './network/ClientPacketHandlers.js'
import { PacketCodec } from './network/PacketCodec.js'
import { storage } from '../storage.js'
import { Compressor } from './network/Compressor.js'
import { clientTimeoutManager } from './network/TimeoutManager.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'
import { TimeoutConfig } from '../../server/config/TimeoutConfig.js'

const logger = new ComponentLogger('ClientNetwork')

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
    this.wsManager = new WebSocketManager(this)
    this.snapshotProcessor = new SnapshotProcessor(this)
    this.packetHandlers = new ClientPacketHandlers(this)
    this.offlineMode = false
    this.lastKnownState = null
    this.timeoutManager = clientTimeoutManager
  }

  init({ wsUrl, name, avatar }) {
    logger.info('init() called', { wsUrl, name, avatar })
    if (!wsUrl) {
      logger.error('init() ERROR: wsUrl is missing!')
      this.enterOfflineMode('No WebSocket URL provided')
      return
    }

    const capabilities = this.world.capabilities
    if (capabilities && !capabilities.canUseWebSocket) {
      logger.warn('WebSocket not available - entering offline mode')
      this.enterOfflineMode('WebSocket not supported')
      return
    }

    this.wsManager.init(wsUrl, name, avatar)
  }

  enterOfflineMode(reason) {
    this.offlineMode = true
    logger.info(`Offline mode activated: ${reason}`)
    this.events.emit('offlineMode', { active: true, reason })
  }

  exitOfflineMode() {
    this.offlineMode = false
    logger.info('Offline mode deactivated')
    this.events.emit('offlineMode', { active: false })
  }

  send(name, data) {
    if (this.offlineMode) {
      logger.warn('Cannot send in offline mode:', name)
      return
    }
    const ignore = ['ping']
    if (!ignore.includes(name) && data.id != this.id) {
      logger.debug('->', { name, data })
    }
    const compressed = this.compressor.compress(data)
    const packet = PacketCodec.encode(name, compressed)
    this.wsManager.send(packet)
  }

  async upload(file) {
    try {
      if (!file || !file.name) {
        throw new Error('Invalid file: missing name property')
      }
      const hash = await hashFile(file)
      if (!hash) {
        throw new Error('Failed to hash file')
      }
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (!ext) {
        throw new Error('Invalid file: missing extension')
      }
      const filename = `${hash}.${ext}`
      const url = `${this.apiUrl}/upload-check?filename=${filename}`
      const resp = await this.timeoutManager.fetchWithTimeout(url, {}, TimeoutConfig.api.defaultFetchTimeout)
      if (!resp.ok) {
        throw new Error(`Upload check failed: ${resp.status} ${resp.statusText}`)
      }
      const data = await resp.json()
      if (typeof data !== 'object' || data === null) {
        throw new Error('Upload check returned invalid data')
      }
      if (data.exists) return

      const form = new FormData()
      form.append('file', file)
      const uploadUrl = `${this.apiUrl}/upload`
      const uploadResp = await this.timeoutManager.fetchWithTimeout(uploadUrl, {
        method: 'POST',
        body: form,
      }, 120000)
      if (!uploadResp.ok) {
        throw new Error(`Upload failed: ${uploadResp.status} ${uploadResp.statusText}`)
      }
    } catch (err) {
      logger.error('File upload error:', err)
      throw err
    }
  }

  onPacket = e => {
    const [method, compressedData] = PacketCodec.decode(e.data)
    const data = this.compressor.decompress(compressedData)
    logger.debug('Packet decoded:', { method, dataSize: data ? JSON.stringify(data).length : 0 })
    if (method && typeof this[method] === 'function') {
      logger.debug('Executing:', method)
      this[method](data)
    }
  }

  onClose = code => {
    const codeMsg = code === 1000 ? 'gracefully' : `(code: ${code})`
    this.chat.add({
      id: uuid(),
      from: null,
      fromId: null,
      body: `Connection lost. Entering offline mode. Your changes will not be saved.`,
      createdAt: moment().toISOString(),
    })
    this.enterOfflineMode(`Connection closed ${codeMsg}`)
    this.events.emit('disconnect', code || true)
    logger.info('disconnect', code)
  }

  onReconnect = () => {
    logger.info('Reconnected to server, clearing stale entities and requesting full snapshot')
    this.exitOfflineMode()
    this.clearStaleEntities()
    this.chat.add({
      id: uuid(),
      from: null,
      fromId: null,
      body: `Connection restored. Syncing with server...`,
      createdAt: moment().toISOString(),
    })
    this.events.emit('reconnect')
    this.requestFullSnapshot()
  }

  clearStaleEntities() {
    const entities = this.world?.entities
    if (!entities) return

    const before = entities.items.size
    const toRemove = []

    entities.items.forEach((entity, id) => {
      if (entity && typeof entity.destroy === 'function') {
        toRemove.push(id)
      }
    })

    toRemove.forEach(id => {
      entities.remove(id)
    })

    logger.info('Cleared stale entities:', { before, after: entities.items.size, removed: toRemove.length })
  }

  requestFullSnapshot() {
    this.send('getSnapshot', { force: true })
  }

  enqueue(method, data) {
    this.protocol.enqueue(method, data)
  }

  getTime() {
    return (performance.now() + this.serverTimeOffset) / 1000
  }

  onSnapshot(data) {
    logger.info('onSnapshot called', { id: data.id, entityCount: data.entities?.length })
    this.id = data.id
    this.serverTimeOffset = data.serverTime - performance.now()
    this.apiUrl = data.apiUrl
    this.maxUploadSize = data.maxUploadSize
    this.assetsUrl = data.assetsUrl
    this.lastKnownState = data
    logger.debug('Calling snapshotProcessor.process()')
    this.snapshotProcessor.process(data)
    logger.debug('snapshotProcessor.process() completed')
  }

  onSettingsModified = data => this.packetHandlers.handleSettingsModified(data)
  onChatAdded = msg => this.packetHandlers.handleChatAdded(msg)
  onChatCleared = () => this.packetHandlers.handleChatCleared()
  onBlueprintAdded = blueprint => this.packetHandlers.handleBlueprintAdded(blueprint)
  onBlueprintModified = change => this.packetHandlers.handleBlueprintModified(change)
  onEntityAdded = data => this.packetHandlers.handleEntityAdded(data)
  onEntityModified = data => this.packetHandlers.handleEntityModified(data)
  onEntityEvent = event => this.packetHandlers.handleEntityEvent(event)
  onEntityRemoved = id => this.packetHandlers.handleEntityRemoved(id)
  onPlayerTeleport = data => this.packetHandlers.handlePlayerTeleport(data)
  onPlayerPush = data => this.packetHandlers.handlePlayerPush(data)
  onPlayerSessionAvatar = data => this.packetHandlers.handlePlayerSessionAvatar(data)
  onLiveKitLevel = data => this.packetHandlers.handleLiveKitLevel(data)
  onMute = data => this.packetHandlers.handleMute(data)
  onPong = time => this.packetHandlers.handlePong(time)
  onKick = code => this.packetHandlers.handleKick(code)
  onHotReload = data => this.packetHandlers.handleHotReload(data)
  onErrors = data => this.packetHandlers.handleErrors(data)

  requestErrors(options = {}) {
    this.send('getErrors', options)
  }

  clearErrors() {
    this.send('clearErrors')
  }

  destroy() {
    this.wsManager.destroy()
  }
}
