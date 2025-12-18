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
    try {
      const playerLimit = this.settings.playerLimit
      if (isNumber(playerLimit) && playerLimit > 0 && this.sockets.size >= playerLimit) {
        const packet = writePacket('kick', 'player_limit')
        ws.send(packet)
        ws.disconnect()
        return
      }

      let authToken = params.authToken
      let name = params.name
      let avatar = params.avatar

      let user
      if (authToken) {
        try {
          const { userId } = await readJWT(authToken)
          user = await this.persistence.loadUser(userId)
        } catch (err) {
          console.error('failed to read authToken:', authToken)
        }
      }
      if (!user) {
        user = {
          id: uuid(),
          name: 'Anonymous',
          avatar: null,
          rank: 0,
          createdAt: moment().toISOString(),
        }
        await this.persistence.saveUser(user.id, user)
        authToken = await createJWT({ userId: user.id })
      }

      if (this.sockets.has(user.id)) {
        const packet = writePacket('kick', 'duplicate_user')
        ws.send(packet)
        ws.disconnect()
        return
      }

      const livekit = await this.livekit.serialize(user.id)

      const socket = new Socket({ id: user.id, ws, network: this })

      socket.player = this.entities.add(
        {
          id: user.id,
          type: 'player',
          position: this.spawn.position.slice(),
          quaternion: this.spawn.quaternion.slice(),
          userId: socket.id,
          name: name || user.name,
          health: HEALTH_MAX,
          avatar: user.avatar || this.settings.avatar?.url || 'asset://avatar.vrm',
          sessionAvatar: avatar || null,
          rank: user.rank,
          enteredAt: Date.now(),
        },
        true
      )

      socket.send('snapshot', {
        id: socket.id,
        serverTime: performance.now(),
        assetsUrl: process.env.PUBLIC_ASSETS_URL,
        apiUrl: process.env.PUBLIC_API_URL,
        maxUploadSize: process.env.PUBLIC_MAX_UPLOAD_SIZE,
        collections: this.collections.serialize(),
        settings: this.settings.serialize(),
        chat: this.chat.serialize(),
        blueprints: this.blueprints.serialize(),
        entities: this.entities.serialize(),
        livekit,
        authToken,
        hasAdminCode: !!process.env.ADMIN_CODE,
      })

      this.sockets.set(socket.id, socket)

      this.events.emit(EVENT.game.enter, { playerId: socket.player.data.id })
    } catch (err) {
      console.error(err)
    }
  }

  onChatAdded = async (socket, msg) => {
    this.chat.add(msg, false)
    this.send('chatAdded', msg, socket.id)
  }

  onCommand = (socket, args) => {
    this.commandHandler.execute(socket, args)
  }

  onModifyRank = async (socket, data) => {
    if (!socket.player.isAdmin()) return
    const { playerId, rank } = data
    if (!playerId) return
    if (typeof rank !== 'number') return
    const player = this.entities.get(playerId)
    if (!player || !player.isPlayer) return
    player.modify({ rank })
    this.send('entityModified', { id: playerId, rank })
    await this.persistence.updateUserRank(playerId, rank)
  }

  onKick = (socket, playerId) => {
    const player = this.entities.get(playerId)
    if (!player) return
    if (socket.player.data.rank <= player.data.rank) return
    const tSocket = this.sockets.get(playerId)
    tSocket.send('kick', 'moderation')
    tSocket.disconnect()
  }

  onMute = (socket, data) => {
    const player = this.entities.get(data.playerId)
    if (!player) return
    if (socket.player.data.rank <= player.data.rank) return
    this.livekit.setMuted(data.playerId, data.muted)
  }

  onBlueprintAdded = (socket, blueprint) => {
    if (!socket.player.isBuilder()) {
      return console.error('player attempted to add blueprint without builder permission')
    }
    this.blueprints.add(blueprint)
    this.send('blueprintAdded', blueprint, socket.id)
    this.dirtyBlueprints.add(blueprint.id)
  }

  onBlueprintModified = (socket, data) => {
    if (!socket.player.isBuilder()) {
      return console.error('player attempted to modify blueprint without builder permission')
    }
    const blueprint = this.blueprints.get(data.id)
    if (data.version > blueprint.version) {
      this.blueprints.modify(data)
      this.send('blueprintModified', data, socket.id)
      this.dirtyBlueprints.add(data.id)
    }
    else {
      socket.send('blueprintModified', blueprint)
    }
  }

  onEntityAdded = (socket, data) => {
    if (!socket.player.isBuilder()) {
      return console.error('player attempted to add entity without builder permission')
    }
    const entity = this.entities.add(data)
    this.send('entityAdded', data, socket.id)
    if (entity.isApp) this.dirtyApps.add(entity.data.id)
  }

  onEntityModified = async (socket, data) => {
    const entity = this.entities.get(data.id)
    if (!entity) return console.error('onEntityModified: no entity found', data)
    entity.modify(data)
    this.send('entityModified', data, socket.id)
    if (entity.isApp) {
      this.dirtyApps.add(entity.data.id)
    }
    if (entity.isPlayer) {
      const changes = {}
      let changed
      if (data.hasOwnProperty('name')) {
        changes.name = data.name
        changed = true
      }
      if (data.hasOwnProperty('avatar')) {
        changes.avatar = data.avatar
        changed = true
      }
      if (changed) {
        await this.persistence.updateUserData(entity.data.userId, changes)
      }
    }
  }

  onEntityEvent = (socket, event) => {
    const [id, version, name, data] = event
    const entity = this.entities.get(id)
    entity?.onEvent(version, name, data, socket.id)
  }

  onEntityRemoved = (socket, id) => {
    if (!socket.player.isBuilder()) return console.error('player attempted to remove entity without builder permission')
    const entity = this.entities.get(id)
    this.entities.remove(id)
    this.send('entityRemoved', id, socket.id)
    if (entity && entity.isApp) this.dirtyApps.add(id)
  }

  onSettingsModified = (socket, data) => {
    if (!socket.player.isBuilder())
      return console.error('player attempted to modify settings without builder permission')
    this.settings.set(data.key, data.value)
    this.send('settingsModified', data, socket.id)
  }

  onSpawnModified = async (socket, op) => {
    if (!socket.player.isBuilder()) {
      return console.error('player attempted to modify spawn without builder permission')
    }
    const player = socket.player
    if (op === 'set') {
      this.spawn = { position: player.data.position.slice(), quaternion: player.data.quaternion.slice() }
    } else if (op === 'clear') {
      this.spawn = { position: [0, 0, 0], quaternion: [0, 0, 0, 1] }
    } else {
      return
    }
    const data = JSON.stringify(this.spawn)
    await this.persistence.setConfig('spawn', data)
    const message = serializeForNetwork({
      id: uuid(),
      userId: 'system',
      name: 'System',
      text: op === 'set' ? 'Spawn updated' : 'Spawn cleared',
      timestamp: Date.now(),
      isSystem: true
    })
    socket.send('chatAdded', message)
  }

  onPlayerTeleport = (socket, data) => {
    this.sendTo(data.networkId, 'playerTeleport', data)
  }

  onPlayerPush = (socket, data) => {
    this.sendTo(data.networkId, 'playerPush', data)
  }

  onPlayerSessionAvatar = (socket, data) => {
    this.sendTo(data.networkId, 'playerSessionAvatar', data.avatar)
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
    if (socket.mcpErrorListener && this.errorMonitor) {
      this.errorMonitor.listeners.delete(socket.mcpErrorListener)
    }
    if (socket.mcpErrorSubscription) {
      socket.mcpErrorSubscription.active = false
    }

    this.livekit.clearModifiers(socket.id)
    socket.player.destroy(true)
    this.sockets.delete(socket.id)
    this.events.emit('exit', { playerId: socket.player.data.id })
  }
}
