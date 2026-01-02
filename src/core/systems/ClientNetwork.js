import moment from 'moment'
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
  }

  init({ wsUrl, name, avatar }) {
    if (!wsUrl) {
      logger.warn('No WebSocket URL provided, running in offline mode', {})
      this.offlineMode = true
      return
    }

    this.wsManager.connect(wsUrl, { name, avatar })
  }

  send(method, data) {
    if (this.offlineMode) return
    this.protocol.send(this.wsManager.socket, method, data)
  }

  sendReliable(method, data, onAck) {
    if (this.offlineMode) return
    if (this.offlineMode) {
      onAck?.()
      return
    }
    const promise = this.protocol.sendReliable(this.wsManager.socket, method, data)
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
    this.serverTimeOffset = moment.now() - t
  }

  getTime() {
    return moment.now() - this.serverTimeOffset
  }

  onSnapshot = (snapshot) => {
    this.snapshotProcessor.process(snapshot)
  }

  onMessage = (data) => {
    this.packetHandlers.handle(data)
  }

  onConnect = () => {
    logger.info('Connected to server', { id: this.id })
  }

  onDisconnect = () => {
    logger.info('Disconnected from server', {})
  }

  onError = (error) => {
    logger.error('Network error', { error: error.message })
  }

  destroy() {
    this.wsManager.disconnect()
    this.core = null
  }
}
