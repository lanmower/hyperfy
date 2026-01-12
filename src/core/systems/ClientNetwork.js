import { hashFile } from '../utils-client.js'
import { BaseNetwork } from '../network/BaseNetwork.js'
import { clientNetworkHandlers } from '../config/HandlerRegistry.js'
import { WebSocketManager } from './network/WebSocketManager.js'
import { SnapshotProcessor } from './network/SnapshotProcessor.js'
import { ClientPacketHandlers } from './network/ClientPacketHandlers.js'
import { MessageHandler } from '../plugins/core/MessageHandler.js'
import { clientTimeoutManager } from './network/TimeoutManager.js'
import { StructuredLogger } from '../utils/logging/index.js'
import { TimeoutConfig } from '../config/TimeoutConfig.js'
import { createClientNetworkHandlers } from './network/ClientNetworkHandlers.js'
import { ClientNetworkState } from './ClientNetworkState.js'
import { ClientNetworkSync } from './ClientNetworkSync.js'

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
    this.protocol.isClient = true
    this.protocol.flushTarget = this
    this.assetsUrl = world.assetsUrl
    this.wsManager = new WebSocketManager(this)
    this.snapshotProcessor = new SnapshotProcessor(this)
    this.packetHandlers = new ClientPacketHandlers(this)
    this.timeoutManager = clientTimeoutManager
    this.networkState = new ClientNetworkState()
    this.networkSync = new ClientNetworkSync(this.networkState, this.wsManager)
    this.handlers = createClientNetworkHandlers(this)
  }

  get id() { return this.networkState.id }
  set id(value) { this.networkState.id = value }
  get apiUrl() { return this.networkState.apiUrl }
  set apiUrl(value) { this.networkState.apiUrl = value }
  get maxUploadSize() { return this.networkState.maxUploadSize }
  set maxUploadSize(value) { this.networkState.maxUploadSize = value }
  get offlineMode() { return this.networkState.offlineMode }
  set offlineMode(value) { this.networkState.offlineMode = value }
  get initialized() { return this.networkState.initialized }
  set initialized(value) { this.networkState.initialized = value }
  get isClient() { return true }
  get serverTimeOffset() { return this.networkState.serverTimeOffset }
  get connected() { return this.wsManager?.ws?.readyState === WebSocket.OPEN }

  init({ wsUrl, name, avatar }) {
    if (this.networkState.initialized) {
      logger.warn('ClientNetwork.init already called, skipping duplicate initialization', { wsUrl })
      return
    }
    this.networkState.markInitialized()
    logger.info('ClientNetwork.init called', { wsUrl, name, avatar })
    if (!wsUrl) {
      logger.warn('No WebSocket URL provided, running in offline mode', {})
      this.networkState.offlineMode = true
      return
    }

    this.wsManager.network = this
    this.wsManager.network.onReconnect = () => this.onReconnect()
    this.wsManager.init(wsUrl, name, avatar)
  }

  onReconnect() {
    this.networkSync.clearQueue()
    logger.info('Client reconnected, requesting full snapshot')
  }

  preFixedUpdate() {
    this.flush()
  }

  send(method, data) {
    if (this.networkState.offlineMode) return
    this.protocol.send(this.wsManager, method, data)
  }

  sendReliable(method, data, onAck) {
    if (this.networkState.offlineMode) {
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

      const response = await fetch(`${this.networkState.apiUrl}/upload`, {
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
      const response = await fetch(`${this.networkState.apiUrl}/hash/${hash}`)
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
    this.networkState.setServerTime(t)
  }

  getTime() {
    return this.networkState.getTime()
  }

  flush() {
    this.networkSync.flush(this)
  }

  onPacket = e => {
    this.networkSync.onPacket(e, this)
  }

  onSnapshot = data => {
    this.networkSync.onSnapshot(data, this.world)
  }

  onSettingsModified = data => this.handlers.onSettingsModified(data)
  onChatAdded = msg => this.handlers.onChatAdded(msg)
  onChatCleared = () => this.handlers.onChatCleared()
  onBlueprintAdded = blueprint => this.handlers.onBlueprintAdded(blueprint)
  onBlueprintModified = change => this.handlers.onBlueprintModified(change)
  onEntityAdded = data => this.handlers.onEntityAdded(data)
  onEntityModified = data => this.handlers.onEntityModified(data)
  onEntityEvent = event => this.handlers.onEntityEvent(event)
  onEntityRemoved = id => this.handlers.onEntityRemoved(id)
  onPlayerTeleport = data => this.handlers.onPlayerTeleport(data)
  onPlayerPush = data => this.handlers.onPlayerPush(data)
  onPlayerSessionAvatar = data => this.handlers.onPlayerSessionAvatar(data)
  onLiveKitLevel = data => this.handlers.onLiveKitLevel(data)
  onMute = data => this.handlers.onMute(data)
  onPong = time => this.handlers.onPong(time)
  onKick = code => this.handlers.onKick(code)
  onClose = code => this.handlers.onClose(code)

  destroy() {
    this.wsManager.disconnect()
    this.networkState.core = null
  }
}
