import { BaseNetwork } from '../network/BaseNetwork.js'
import { serverNetworkHandlers } from '../config/HandlerRegistry.js'
import { FileUploadHandler } from './server/FileUploadHandler.js'
import { WorldSaveManager } from './server/WorldSaveManager.js'
import { PlayerConnectionManager } from './server/PlayerConnectionManager.js'
import { BuilderCommandHandler } from './server/BuilderCommandHandler.js'
import { ServerLifecycleManager } from './server/ServerLifecycleManager.js'
import { SocketManager } from './server/SocketManager.js'
import { ChatManager } from './server/ChatManager.js'
import { Compressor } from './network/Compressor.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

let ErrorHandlingService = null

const logger = new ComponentLogger('ServerNetwork')
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
    this.lifecycleManager = new ServerLifecycleManager(this)
    this.socketManager = new SocketManager(this)
    this.chatManager = new ChatManager(this)
    this.fileUploadHandler = new FileUploadHandler(this)
    this.worldSaveManager = new WorldSaveManager(this)
    this.playerConnectionManager = new PlayerConnectionManager(this)
    this.builderCommandHandler = new BuilderCommandHandler(this)
    this.socketIntervalId = setInterval(() => this.socketManager.checkSockets(), PING_RATE * 1000)
    this.setupHotReload()
  }

  setupHotReload() {
    if (typeof process !== 'undefined' && process.on) {
      process.on('message', msg => {
        if (msg?.type === 'hotReload') {
          logger.info('Broadcasting hot reload to clients', {})
          this.send('hotReload', { timestamp: Date.now() })
        }
      })
    }
  }

  init(config) {
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
    return this.playerConnectionManager.onConnection(ws, params)
  }

  onChatAdded = (socket, msg) => this.chatManager.handleChatAdded(socket, msg)

  onCommand = (socket, args) => this.chatManager.handleCommand(socket, args)

  onModifyRank = (socket, data) => {
    return this.playerConnectionManager.onModifyRank(socket, data)
  }

  onKick = (socket, playerId) => {
    return this.playerConnectionManager.onKick(socket, playerId)
  }

  onMute = (socket, data) => {
    return this.playerConnectionManager.onMute(socket, data)
  }

  onBlueprintAdded = (socket, blueprint) => {
    return this.builderCommandHandler.onBlueprintAdded(socket, blueprint)
  }

  onBlueprintModified = (socket, data) => {
    return this.builderCommandHandler.onBlueprintModified(socket, data)
  }

  onEntityAdded = (socket, data) => {
    return this.builderCommandHandler.onEntityAdded(socket, data)
  }

  onEntityModified = async (socket, data) => {
    return this.builderCommandHandler.onEntityModified(socket, data)
  }

  onEntityEvent = (socket, event) => {
    return this.builderCommandHandler.onEntityEvent(socket, event)
  }

  onEntityRemoved = (socket, id) => {
    return this.builderCommandHandler.onEntityRemoved(socket, id)
  }

  onSettingsModified = (socket, data) => {
    return this.builderCommandHandler.onSettingsModified(socket, data)
  }

  onSpawnModified = async (socket, op) => {
    return this.builderCommandHandler.onSpawnModified(socket, op)
  }

  onPlayerTeleport = (socket, data) => {
    return this.playerConnectionManager.onPlayerTeleport(socket, data)
  }

  onPlayerPush = (socket, data) => {
    return this.playerConnectionManager.onPlayerPush(socket, data)
  }

  onPlayerSessionAvatar = (socket, data) => {
    return this.playerConnectionManager.onPlayerSessionAvatar(socket, data)
  }

  onPing = (socket, time) => {
    socket.send('pong', time)
  }

  onErrorEvent = (socket, errorEvent) => this.errorHandlingService.onErrorEvent(socket, errorEvent)

  onErrorReport = (socket, data) => this.errorHandlingService.onErrorReport(socket, data)

  onClientError = (socket, errorData) => {
    if (this.errors) {
      this.errors.receiveClientError({
        error: errorData.error,
        clientId: errorData.clientId,
        context: errorData.context,
        timestamp: errorData.timestamp
      })
    }
  }

  onMcpSubscribeErrors = (socket, options = {}) => this.errorHandlingService.onMcpSubscribeErrors(socket, options)

  onGetErrors = (socket, options = {}) => this.errorHandlingService.onGetErrors(socket, options)

  onClearErrors = (socket) => this.errorHandlingService.onClearErrors(socket)

  onFileUpload = (socket, data) => this.fileUploadHandler.onFileUpload(socket, data)

  onFileUploadCheck = (socket, data) => this.fileUploadHandler.onFileUploadCheck(socket, data)

  onFileUploadStats = (socket) => this.fileUploadHandler.onFileUploadStats(socket)

  onDisconnect = (socket, code) => {
    return this.playerConnectionManager.onDisconnect(socket, code)
  }
}
