import { BaseNetwork } from '../network/BaseNetwork.js'
import { serverNetworkHandlers } from '../config/HandlerRegistry.js'
import { NetworkCore } from '../network/NetworkCore.js'
import { FileUploadHandler } from './server/FileUploadHandler.js'
import { WorldSaveManager } from './server/WorldSaveManager.js'
import { PlayerConnectionManager } from './server/PlayerConnectionManager.js'
import { BuilderCommandHandler } from './server/BuilderCommandHandler.js'
import { ServerLifecycleManager } from './server/ServerLifecycleManager.js'
import { SocketManager } from './server/SocketManager.js'
import { Compressor } from './network/Compressor.js'
import { StructuredLogger } from '../utils/logging/index.js'

let ErrorHandlingService = null

const logger = new StructuredLogger('ServerNetwork')
const PING_RATE = 1

export class ServerNetwork extends BaseNetwork {
  static DEPS = {
    errors: 'errors',
    entities: 'entities',
    settings: 'settings',
    blueprints: 'blueprints',
    livekit: 'livekit',
    events: 'events',
    chat: 'chat',
    collections: 'collections',
  }

  static EVENTS = {
    settingChanged: 'saveSettings',
  }

  constructor(world) {
    super(world, serverNetworkHandlers)
    this.id = 0
    this.sockets = new Map()
    this.saveTimerId = null
    this.dirtyBlueprints = new Set()
    this.dirtyApps = new Set()
    this.isServer = true
    this.protocol.isServer = true
    this.protocol.isConnected = true
    this.protocol.flushTarget = this
    this.compressor = new Compressor()
    this.core = new NetworkCore()
    this.lifecycleManager = new ServerLifecycleManager(this)
    this.socketManager = new SocketManager(this)
    this.fileUploadHandler = new FileUploadHandler(this)
    this.worldSaveManager = new WorldSaveManager(this)
    this.playerConnectionManager = new PlayerConnectionManager(this)
    this.builderCommandHandler = new BuilderCommandHandler(this)
    this.socketIntervalId = setInterval(() => this.socketManager.checkSockets(), PING_RATE * 1000)
    this.initialized = false
    this.hotReloadHandler = null
    this.setupHotReload()
  }

  setupHotReload() {
    if (typeof process !== 'undefined' && process.on) {
      // Remove previous handler if exists to prevent duplication
      if (this.hotReloadHandler) {
        process.removeListener('message', this.hotReloadHandler)
      }
      this.hotReloadHandler = msg => {
        if (msg?.type === 'hotReload') {
          logger.info('Broadcasting hot reload to clients', {})
          this.send('hotReload', { timestamp: Date.now() })
        }
      }
      process.on('message', this.hotReloadHandler)
    }
  }

  init(config) {
    if (this.initialized) {
      logger.warn('ServerNetwork.init already called, skipping duplicate initialization', { config })
      return
    }
    this.initialized = true
    this.lifecycleManager.init(config)
  }

  async start() {
    await this.lifecycleManager.start()
  }

  send(name, data, ignoreSocketId) {
    this.socketManager.send(name, data, ignoreSocketId)
  }

  sendTo(socketId, name, data) {
    this.socketManager.sendTo(socketId, name, data)
  }

  checkSockets() {
    this.socketManager.checkSockets()
  }

  enqueue(socket, method, data) {
    this.protocol.enqueue(socket, method, data)
  }

  getTime() {
    return this.protocol.getTime()
  }

  save = () => this.worldSaveManager.save()

  saveSettings = () => this.worldSaveManager.saveSettings()

  async onConnection(ws, params) {
    logger.info('Player connecting', { params })
    return await this.playerConnectionManager.onConnection(ws, params)
  }

  onDisconnection(playerId) {
    logger.info('Player disconnecting', { playerId })
    this.playerConnectionManager.handleDisconnection(playerId)
  }

  onDisconnect(socket, code) {
    this.playerConnectionManager.onDisconnect(socket, code)
  }

  async onMessage(ws, name, data) {
    await this.socketManager.onMessage(ws, name, data)
  }

  registerSocket(playerId, ws) {
    this.sockets.set(playerId, ws)
    this.core.registerSocket(playerId, ws)
  }

  unregisterSocket(playerId) {
    this.sockets.delete(playerId)
    this.core.unregisterSocket(playerId)
  }

  commit() {
    const shouldBroadcast = this.world.frame % Math.round(1 / this.world.networkRate) === 0
    if (shouldBroadcast && this.sockets.size > 0) {
      const snapshot = {
        time: this.world.time,
        frame: this.world.frame,
        entities: this.entities.serialize(),
      }
      this.send('snapshot', snapshot)
    }
  }

  onClientLogs(socket, data) {
    if (!data || !Array.isArray(data.logs)) {
      logger.warn('Invalid client logs data', { hasData: !!data, isArray: Array.isArray(data?.logs) })
      return
    }
    for (const logEntry of data.logs) {
      if (logEntry && typeof logEntry === 'object') {
        console.log(logEntry.message || JSON.stringify(logEntry))
      }
    }
  }

  destroy() {
    if (this.socketIntervalId) clearInterval(this.socketIntervalId)
    if (this.saveTimerId) clearTimeout(this.saveTimerId)
    if (this.hotReloadHandler && typeof process !== 'undefined' && process.removeListener) {
      process.removeListener('message', this.hotReloadHandler)
      this.hotReloadHandler = null
    }
    this.socketManager?.destroy?.()
    this.lifecycleManager?.destroy?.()
    this.core = null
  }
}
