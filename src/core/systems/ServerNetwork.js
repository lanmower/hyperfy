import moment from 'moment'
import { writePacket } from '../packets.js'
import { Socket } from '../Socket.js'
import { uuid } from '../utils.js'
import { System } from './System.js'
import { createJWT, readJWT } from '../utils-server.js'
import { cloneDeep, isNumber } from 'lodash-es'
import * as THREE from '../extras/three.js'
import { Ranks } from '../extras/ranks.js'
import { CommandHandler } from '../../server/services/CommandHandler.js'
import { WorldPersistence } from '../../server/services/WorldPersistence.js'
import { FileStorage } from '../../server/services/FileStorage.js'
import { FileUploader } from '../../server/services/FileUploader.js'
import { NetworkProtocol } from '../network/NetworkProtocol.js'
import { serializeForNetwork } from '../schemas/ChatMessage.schema.js'
import { errorObserver } from '../../server/services/ErrorObserver.js'

const SAVE_INTERVAL = parseInt(process.env.SAVE_INTERVAL || '60') // seconds
const PING_RATE = 1 // seconds
const defaultSpawn = '{ "position": [0, 0, 0], "quaternion": [0, 0, 0, 1] }'

const HEALTH_MAX = 100

/**
 * Server Network System
 *
 * - runs on the server
 * - provides abstract network methods matching ClientNetwork
 *
 */
export class ServerNetwork extends System {
  constructor(world) {
    super(world)
    this.id = 0
    this.sockets = new Map()
    this.socketIntervalId = setInterval(() => this.checkSockets(), PING_RATE * 1000)
    this.saveTimerId = null
    this.dirtyBlueprints = new Set()
    this.dirtyApps = new Set()
    this.isServer = true
    this.isConnected = true
    this.protocol = new NetworkProtocol('ServerNetwork')
    this.protocol.isServer = true
    this.protocol.isConnected = true
    this.protocol.flushTarget = this
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
      this.world.blueprints.add(data, true)
    }
    const entities = await this.persistence.loadEntities()
    for (const entity of entities) {
      const data = JSON.parse(entity.data)
      data.state = {}
      this.world.entities.add(data, true)
    }
    try {
      const settings = await this.persistence.loadSettings()
      this.world.settings.deserialize(settings)
      this.world.settings.setHasAdminCode(!!process.env.ADMIN_CODE)
    } catch (err) {
      console.error(err)
    }
    // watch settings changes
    this.world.events.on('settingChanged', this.saveSettings)
    // queue first save
    if (SAVE_INTERVAL) {
      this.saveTimerId = setTimeout(this.save, SAVE_INTERVAL * 1000)
    }
  }

  preFixedUpdate() {
    this.protocol.flush()
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
      const blueprint = this.world.blueprints.get(id)
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
      const entity = this.world.entities.get(id)
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
    const data = this.world.settings.serialize()
    await this.persistence.setConfig('settings', JSON.stringify(data))
  }

  async onConnection(ws, params) {
    try {
      // check player limit
      const playerLimit = this.world.settings.playerLimit
      if (isNumber(playerLimit) && playerLimit > 0 && this.sockets.size >= playerLimit) {
        const packet = writePacket('kick', 'player_limit')
        ws.send(packet)
        ws.disconnect()
        return
      }

      // check connection params
      let authToken = params.authToken
      let name = params.name
      let avatar = params.avatar

      // get or create user
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

      // disconnect if user already in this world
      if (this.sockets.has(user.id)) {
        const packet = writePacket('kick', 'duplicate_user')
        ws.send(packet)
        ws.disconnect()
        return
      }

      // livekit options
      const livekit = await this.world.livekit.serialize(user.id)

      // create socket
      const socket = new Socket({ id: user.id, ws, network: this })

      // spawn player
      socket.player = this.world.entities.add(
        {
          id: user.id,
          type: 'player',
          position: this.spawn.position.slice(),
          quaternion: this.spawn.quaternion.slice(),
          userId: socket.id,
          name: name || user.name,
          health: HEALTH_MAX,
          avatar: user.avatar || this.world.settings.avatar?.url || 'asset://avatar.vrm',
          sessionAvatar: avatar || null,
          rank: user.rank,
          enteredAt: Date.now(),
        },
        true
      )

      // send snapshot
      socket.send('snapshot', {
        id: socket.id,
        serverTime: performance.now(),
        assetsUrl: process.env.PUBLIC_ASSETS_URL,
        apiUrl: process.env.PUBLIC_API_URL,
        maxUploadSize: process.env.PUBLIC_MAX_UPLOAD_SIZE,
        collections: this.world.collections.serialize(),
        settings: this.world.settings.serialize(),
        chat: this.world.chat.serialize(),
        blueprints: this.world.blueprints.serialize(),
        entities: this.world.entities.serialize(),
        livekit,
        authToken,
        hasAdminCode: !!process.env.ADMIN_CODE,
      })

      this.sockets.set(socket.id, socket)

      // enter events on the server are sent after the snapshot.
      // on the client these are sent during PlayerRemote.js entity instantiation!
      this.world.events.emit('enter', { playerId: socket.player.data.id })
    } catch (err) {
      console.error(err)
    }
  }

  onChatAdded = async (socket, msg) => {
    this.world.chat.add(msg, false)
    this.send('chatAdded', msg, socket.id)
  }

  onCommand = (socket, args) => {
    this.commandHandler.execute(socket, args)
  }

  onModifyRank = async (socket, data) => {
    if (!socket.player.isAdmin()) return
    const { playerId, rank } = data
    if (!playerId) return
    if (!isNumber(rank)) return
    const player = this.world.entities.get(playerId)
    if (!player || !player.isPlayer) return
    player.modify({ rank })
    this.send('entityModified', { id: playerId, rank })
    await this.persistence.updateUserRank(playerId, rank)
  }

  onKick = (socket, playerId) => {
    const player = this.world.entities.get(playerId)
    if (!player) return
    // admins can kick builders + visitors
    // builders can kick visitors
    // visitors cannot kick anyone
    if (socket.player.data.rank <= player.data.rank) return
    const tSocket = this.sockets.get(playerId)
    tSocket.send('kick', 'moderation')
    tSocket.disconnect()
  }

  onMute = (socket, data) => {
    const player = this.world.entities.get(data.playerId)
    if (!player) return
    // admins can mute builders + visitors
    // builders can mute visitors
    // visitors cannot mute anyone
    if (socket.player.data.rank <= player.data.rank) return
    this.world.livekit.setMuted(data.playerId, data.muted)
  }

  onBlueprintAdded = (socket, blueprint) => {
    if (!socket.player.isBuilder()) {
      return console.error('player attempted to add blueprint without builder permission')
    }
    this.world.blueprints.add(blueprint)
    this.send('blueprintAdded', blueprint, socket.id)
    this.dirtyBlueprints.add(blueprint.id)
  }

  onBlueprintModified = (socket, data) => {
    if (!socket.player.isBuilder()) {
      return console.error('player attempted to modify blueprint without builder permission')
    }
    const blueprint = this.world.blueprints.get(data.id)
    // if new version is greater than current version, allow it
    if (data.version > blueprint.version) {
      this.world.blueprints.modify(data)
      this.send('blueprintModified', data, socket.id)
      this.dirtyBlueprints.add(data.id)
    }
    // otherwise, send a revert back to client, because someone else modified before them
    else {
      socket.send('blueprintModified', blueprint)
    }
  }

  onEntityAdded = (socket, data) => {
    if (!socket.player.isBuilder()) {
      return console.error('player attempted to add entity without builder permission')
    }
    const entity = this.world.entities.add(data)
    this.send('entityAdded', data, socket.id)
    if (entity.isApp) this.dirtyApps.add(entity.data.id)
  }

  onEntityModified = async (socket, data) => {
    const entity = this.world.entities.get(data.id)
    if (!entity) return console.error('onEntityModified: no entity found', data)
    entity.modify(data)
    this.send('entityModified', data, socket.id)
    if (entity.isApp) {
      // mark for saving
      this.dirtyApps.add(entity.data.id)
    }
    if (entity.isPlayer) {
      // persist player name and avatar changes
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
    const entity = this.world.entities.get(id)
    entity?.onEvent(version, name, data, socket.id)
  }

  onEntityRemoved = (socket, id) => {
    if (!socket.player.isBuilder()) return console.error('player attempted to remove entity without builder permission')
    const entity = this.world.entities.get(id)
    this.world.entities.remove(id)
    this.send('entityRemoved', id, socket.id)
    if (entity && entity.isApp) this.dirtyApps.add(id)
  }

  onSettingsModified = (socket, data) => {
    if (!socket.player.isBuilder())
      return console.error('player attempted to modify settings without builder permission')
    this.world.settings.set(data.key, data.value)
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

  onErrorEvent = (socket, errorEvent) => {
    const metadata = {
      realTime: true,
      clientId: socket.id,
      userId: socket.player?.data?.id,
      userName: socket.player?.data?.name,
      clientIP: socket.ws?.remoteAddress || 'unknown',
      timestamp: Date.now()
    }

    errorObserver.recordClientError(socket.id, errorEvent, metadata)

    if (this.world.errorMonitor) {
      this.world.errorMonitor.receiveClientError({
        error: errorEvent,
        ...metadata
      })
    }

    this.sockets.forEach(mcpSocket => {
      if (mcpSocket.mcpErrorSubscription?.active) {
        mcpSocket.send('mcpErrorEvent', {
          error: errorEvent,
          ...metadata
        })
      }
    })
  }

  onErrorReport = (socket, data) => {
    const metadata = {
      realTime: data.realTime || false,
      clientId: socket.id,
      userId: socket.player?.data?.id,
      userName: socket.player?.data?.name,
      clientIP: socket.ws?.remoteAddress || 'unknown',
      timestamp: Date.now()
    }

    errorObserver.recordClientError(socket.id, data.error || data, metadata)

    if (this.world.errorMonitor) {
      this.world.errorMonitor.receiveClientError({
        error: data.error || data,
        ...metadata
      })
    }

    this.sockets.forEach(mcpSocket => {
      if (mcpSocket.mcpErrorSubscription?.active) {
        mcpSocket.send('mcpErrorEvent', {
          error: data.error || data,
          ...metadata,
          timestamp: new Date().toISOString(),
          side: 'client-reported'
        })
      }
    })
  }

  onMcpSubscribeErrors = (socket, options = {}) => {
    if (!this.world.errorMonitor) return

    const errorListener = (event, errorData) => {
      if (event === 'error' || event === 'critical') {
        socket.send('mcpErrorEvent', errorData)
      }
    }

    socket.mcpErrorListener = errorListener
    socket.mcpErrorSubscription = { active: true, options }
    this.world.errorMonitor.listeners.add(errorListener)
  }

  onGetErrors = (socket, options = {}) => {
    if (!this.world.errorMonitor) {
      socket.send('errors', { errors: [], stats: null })
      return
    }
    const errors = this.world.errorMonitor.getErrors(options)
    const stats = this.world.errorMonitor.getStats()
    socket.send('errors', { errors, stats })
  }

  onClearErrors = (socket) => {
    if (!this.world.errorMonitor) {
      socket.send('clearErrors', { cleared: 0 })
      return
    }
    const count = this.world.errorMonitor.clearErrors()
    socket.send('clearErrors', { cleared: count })
  }

  onFileUpload = async (socket, data) => {
    try {
      const { buffer, filename, mimeType, metadata } = data
      const bufferData = Buffer.from(buffer)

      const result = await this.fileUploader.uploadFile(bufferData, filename, {
        mimeType: mimeType || 'application/octet-stream',
        uploader: socket.id,
        metadata: metadata || {},
        onProgress: (progress) => {
          socket.send('fileUploadProgress', { filename, progress })
        }
      })

      socket.send('fileUploadComplete', {
        filename,
        hash: result.hash,
        url: result.url,
        size: result.size,
        deduplicated: result.deduplicated
      })

    } catch (error) {
      console.error('File upload error:', error)
      socket.send('fileUploadError', {
        filename: data.filename,
        error: error.message
      })
    }
  }

  onFileUploadCheck = async (socket, data) => {
    try {
      const { hash } = data
      const exists = await this.fileUploader.checkExists(hash)
      const record = exists ? await this.fileStorage.getRecord(hash) : null

      socket.send('fileUploadCheckResult', {
        hash,
        exists,
        record
      })
    } catch (error) {
      console.error('File upload check error:', error)
      socket.send('fileUploadCheckResult', {
        hash: data.hash,
        exists: false,
        error: error.message
      })
    }
  }

  onFileUploadStats = async (socket) => {
    try {
      const stats = this.fileUploader.getStats()
      const storageStats = await this.fileStorage.getStats()

      socket.send('fileUploadStats', {
        uploader: stats,
        storage: storageStats
      })
    } catch (error) {
      console.error('File upload stats error:', error)
      socket.send('fileUploadStats', {
        error: error.message
      })
    }
  }

  onDisconnect = (socket, code) => {
    if (socket.mcpErrorListener && this.world.errorMonitor) {
      this.world.errorMonitor.listeners.delete(socket.mcpErrorListener)
    }
    if (socket.mcpErrorSubscription) {
      socket.mcpErrorSubscription.active = false
    }

    this.world.livekit.clearModifiers(socket.id)
    socket.player.destroy(true)
    this.sockets.delete(socket.id)
  }
}
