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
import { PacketHandlers } from './network/PacketHandlers.js'
import { serverNetworkHandlers } from '../config/HandlerRegistry.js'

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
    this.setupHotReload()
    this.handlers = new PacketHandlers(this)
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

  save = async () => {
    const counts = { upsertedBlueprints: 0, upsertedApps: 0, deletedApps: 0 }
    const now = moment().toISOString()
    for (const id of this.dirtyBlueprints) {
      const blueprint = this.blueprints.get(id)
      try {
        await this.persistence.saveBlueprint(blueprint.id, blueprint, now, now)
        counts.upsertedBlueprints++
        this.dirtyBlueprints.delete(id)
      } catch (err) {
        console.log(`error saving blueprint: ${blueprint.id}`)
        console.error(err)
      }
    }
    for (const id of this.dirtyApps) {
      const entity = this.entities.get(id)
      if (entity) {
        if (entity.data.uploader || entity.data.mover) continue
        try {
          await this.persistence.saveEntity(entity.data.id, entity.data, now, now)
          counts.upsertedApps++
          this.dirtyApps.delete(id)
        } catch (err) {
          console.log(`error saving entity: ${entity.data.id}`)
          console.error(err)
        }
      } else {
        await this.persistence.deleteEntity(id)
        counts.deletedApps++
        this.dirtyApps.delete(id)
      }
    }
    const didSave = counts.upsertedBlueprints > 0 || counts.upsertedApps > 0 || counts.deletedApps > 0
    if (didSave) {
      console.log(`world saved (${counts.upsertedBlueprints} blueprints, ${counts.upsertedApps} apps, ${counts.deletedApps} deleted)`)
    }
    this.saveTimerId = setTimeout(this.save, SAVE_INTERVAL * 1000)
  }

  saveSettings = async () => {
    const data = this.settings.serialize()
    await this.persistence.setConfig('settings', JSON.stringify(data))
  }

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

      this.events.emit('enter', { playerId: socket.player.data.id })
    } catch (err) {
      console.error(err)
    }
  }

  onChatAdded = (socket, msg) => this.handlers.onChatAdded(socket, msg)
  onCommand = (socket, args) => this.handlers.onCommand(socket, args)
  onModifyRank = (socket, data) => this.handlers.onModifyRank(socket, data)
  onKick = (socket, playerId) => this.handlers.onKick(socket, playerId)
  onMute = (socket, data) => this.handlers.onMute(socket, data)
  onBlueprintAdded = (socket, blueprint) => this.handlers.onBlueprintAdded(socket, blueprint)
  onBlueprintModified = (socket, data) => this.handlers.onBlueprintModified(socket, data)
  onEntityAdded = (socket, data) => this.handlers.onEntityAdded(socket, data)
  onEntityModified = (socket, data) => this.handlers.onEntityModified(socket, data)
  onEntityEvent = (socket, event) => this.handlers.onEntityEvent(socket, event)
  onEntityRemoved = (socket, id) => this.handlers.onEntityRemoved(socket, id)
  onSettingsModified = (socket, data) => this.handlers.onSettingsModified(socket, data)
  onSpawnModified = (socket, op) => this.handlers.onSpawnModified(socket, op)
  onPlayerTeleport = (socket, data) => this.handlers.onPlayerTeleport(socket, data)
  onPlayerPush = (socket, data) => this.handlers.onPlayerPush(socket, data)
  onPlayerSessionAvatar = (socket, data) => this.handlers.onPlayerSessionAvatar(socket, data)
  onPing = (socket, time) => this.handlers.onPing(socket, time)
  onErrorEvent = (socket, errorEvent) => this.handlers.onErrorEvent(socket, errorEvent)
  onErrorReport = (socket, data) => this.handlers.onErrorReport(socket, data)
  onMcpSubscribeErrors = (socket, options) => this.handlers.onMcpSubscribeErrors(socket, options)
  onGetErrors = (socket, options) => this.handlers.onGetErrors(socket, options)
  onClearErrors = (socket) => this.handlers.onClearErrors(socket)
  onFileUpload = (socket, data) => this.handlers.onFileUpload(socket, data)
  onFileUploadCheck = (socket, data) => this.handlers.onFileUploadCheck(socket, data)
  onFileUploadStats = (socket) => this.handlers.onFileUploadStats(socket)
  onDisconnect = (socket, code) => this.handlers.onDisconnect(socket, code)
}
