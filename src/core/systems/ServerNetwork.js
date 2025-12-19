import moment from 'moment'
import { writePacket } from '../packets.js'
import { Socket } from '../Socket.js'
import { uuid } from '../utils.js'
import { createJWT, readJWT } from '../utils-server.js'
import { cloneDeep, isNumber } from 'lodash-es'
import * as THREE from '../extras/three.js'
import { Ranks } from '../extras/ranks.js'
import { CommandHandler } from '../../server/services/CommandHandler.js'
import { WorldPersistence } from '../../server/services/WorldPersistence.js'
import { FileStorage } from '../../server/services/FileStorage.js'
import { FileUploader } from '../../server/services/FileUploader.js'
import { BaseNetwork } from '../network/BaseNetwork.js'
import { serverNetworkHandlers } from '../config/HandlerRegistry.js'
import { serializeForNetwork } from '../schemas/ChatMessage.schema.js'
import { errorObserver } from '../../server/services/ErrorObserver.js'
import { EVENT } from '../constants/EventNames.js'
import { FileUploadHandler } from './server/FileUploadHandler.js'
import { ErrorHandlingService } from './server/ErrorHandlingService.js'
import { WorldSaveManager } from './server/WorldSaveManager.js'
import { PlayerConnectionManager } from './server/PlayerConnectionManager.js'
import { BuilderCommandHandler } from './server/BuilderCommandHandler.js'

const SAVE_INTERVAL = parseInt(process.env.SAVE_INTERVAL || '60') // seconds
const PING_RATE = 1 // seconds
const defaultSpawn = '{ "position": [0, 0, 0], "quaternion": [0, 0, 0, 1] }'

const HEALTH_MAX = 100

export class ServerNetwork extends BaseNetwork {
  static DEPS = {
    errorMonitor: 'errorMonitor',
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
    this.socketIntervalId = setInterval(() => this.checkSockets(), PING_RATE * 1000)
    this.saveTimerId = null
    this.dirtyBlueprints = new Set()
    this.dirtyApps = new Set()
    this.isServer = true
    this.protocol.isServer = true
    this.protocol.isConnected = true
    this.protocol.flushTarget = this
    this.fileUploadHandler = new FileUploadHandler(this)
    this.errorHandlingService = new ErrorHandlingService(this)
    this.worldSaveManager = new WorldSaveManager(this)
    this.playerConnectionManager = new PlayerConnectionManager(this)
    this.builderCommandHandler = new BuilderCommandHandler(this)
    this.setupHotReload()
  }

  setupHotReload() {
    process.on('message', msg => {
      if (msg?.type === 'hotReload') {
        console.log('[HMR] Broadcasting reload to clients')
        this.send('hotReload', { timestamp: Date.now() })
      }
    })
  }

  init({ db, assetsDir }) {
    this.db = db
    this.fileStorage = new FileStorage(assetsDir, db)
    this.fileUploader = new FileUploader(this.fileStorage, parseInt(process.env.PUBLIC_MAX_UPLOAD_SIZE || 50 * 1024 * 1024))
    this.commandHandler = new CommandHandler(this.world, db)
    this.persistence = new WorldPersistence(db, this.fileUploader)
  }

  async start() {
    this.spawn = JSON.parse(await this.persistence.loadSpawn())
    const blueprints = await this.persistence.loadBlueprints()
    for (const blueprint of blueprints) {
      const data = JSON.parse(blueprint.data)
      this.blueprints.add(data, true)
    }
    const entities = await this.persistence.loadEntities()
    for (const entity of entities) {
      const data = JSON.parse(entity.data)
      data.state = {}
      this.entities.add(data, true)
    }
    try {
      const settings = await this.persistence.loadSettings()
      this.settings.deserialize(settings)
      this.settings.setHasAdminCode(!!process.env.ADMIN_CODE)
    } catch (err) {
      console.error(err)
    }
    if (SAVE_INTERVAL) {
      this.saveTimerId = setTimeout(this.save, SAVE_INTERVAL * 1000)
    }
  }

  send(name, data, ignoreSocketId) {
    const packet = writePacket(name, data)
    this.sockets.forEach(socket => {
      if (socket.id === ignoreSocketId) return
      socket.sendPacket(packet)
    })
  }

  sendTo(socketId, name, data) {
    const socket = this.sockets.get(socketId)
    socket?.send(name, data)
  }

  checkSockets() {
    const dead = []
    this.sockets.forEach(socket => {
      if (!socket.alive) {
        dead.push(socket)
      } else {
        socket.ping()
      }
    })
    dead.forEach(socket => socket.disconnect())
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

  onChatAdded = async (socket, msg) => {
    this.chat.add(msg, false)
    this.send('chatAdded', msg, socket.id)
  }

  onCommand = (socket, args) => {
    this.commandHandler.execute(socket, args)
  }

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
