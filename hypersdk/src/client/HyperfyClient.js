import { EventEmitter } from 'eventemitter3'
import { WebSocketManager } from './WebSocketManager.js'
import { Player } from './Player.js'
import { Entity } from './Entity.js'
import { App } from './App.js'
import { Chat } from './Chat.js'
import { FileUploader } from './FileUploader.js'
import { ErrorHandler } from '../utils/ErrorHandler.js'

export class HyperfyClient extends EventEmitter {
  constructor(url, options = {}) {
    super()
    this.url = url
    this.options = {
      name: options.name || 'Node.js SDK',
      avatar: options.avatar || null,
      authToken: options.authToken || null,
      autoReconnect: options.autoReconnect !== false,
      ...options
    }

    // Core components
    this.wsManager = new WebSocketManager(this.buildWebSocketUrl(), {
      maxReconnectAttempts: this.options.autoReconnect ? 5 : 0,
      reconnectDelay: 1000
    })

    // Client state
    this.connected = false
    this.ready = false
    this.player = null
    this.entities = new Map()
    this.blueprints = new Map()
    this.settings = {}
    this.collections = null

    // Sub-managers
    this.chat = null
    this.fileUploader = null
    this.errorHandler = new ErrorHandler()

    // Internal state
    this.serverTimeOffset = 0
    this.assetsUrl = null
    this.apiUrl = null
    this.maxUploadSize = null

    this.setupErrorHandlerNetworking()
    this.setupEventListeners()
  }

  setupErrorHandlerNetworking() {
    this.errorHandler.setNetworkSender((errorEvent) => {
      if (this.wsManager?.ws?.readyState === 1) {
        this.wsManager.send('errorEvent', errorEvent)
      }
    })
  }

  buildWebSocketUrl() {
    let url = this.url
    const params = new URLSearchParams()

    if (this.options.authToken) {
      params.append('authToken', this.options.authToken)
    }
    if (this.options.name) {
      params.append('name', encodeURIComponent(this.options.name))
    }
    if (this.options.avatar) {
      params.append('avatar', encodeURIComponent(this.options.avatar))
    }

    const paramString = params.toString()
    if (paramString) {
      url += (url.includes('?') ? '&' : '?') + paramString
    }

    return url
  }

  setupEventListeners() {
    this.wsManager.on('connected', () => {
      this.connected = true
      this.emit('connected')
    })

    this.wsManager.on('disconnected', (data) => {
      this.connected = false
      this.ready = false
      this.emit('disconnected', data)
    })

    this.wsManager.on('error', (error) => {
      this.errorHandler.handleError(error)
      this.emit('error', error)
    })

    // Packet handlers - complete set matching Hyperfy protocol
    this.wsManager.on('onSnapshot', this.handleSnapshot.bind(this))
    this.wsManager.on('onCommand', this.handleCommand.bind(this))
    this.wsManager.on('onChatAdded', this.handleChatAdded.bind(this))
    this.wsManager.on('onChatCleared', this.handleChatCleared.bind(this))
    this.wsManager.on('onBlueprintAdded', this.handleBlueprintAdded.bind(this))
    this.wsManager.on('onBlueprintModified', this.handleBlueprintModified.bind(this))
    this.wsManager.on('onEntityAdded', this.handleEntityAdded.bind(this))
    this.wsManager.on('onEntityModified', this.handleEntityModified.bind(this))
    this.wsManager.on('onEntityEvent', this.handleEntityEvent.bind(this))
    this.wsManager.on('onEntityRemoved', this.handleEntityRemoved.bind(this))
    this.wsManager.on('onPlayerTeleport', this.handlePlayerTeleport.bind(this))
    this.wsManager.on('onPlayerPush', this.handlePlayerPush.bind(this))
    this.wsManager.on('onPlayerSessionAvatar', this.handlePlayerSessionAvatar.bind(this))
    this.wsManager.on('onLiveKitLevel', this.handleLiveKitLevel.bind(this))
    this.wsManager.on('onMute', this.handleMute.bind(this))
    this.wsManager.on('onSettingsModified', this.handleSettingsModified.bind(this))
    this.wsManager.on('onSpawnModified', this.handleSpawnModified.bind(this))
    this.wsManager.on('onModifyRank', this.handleModifyRank.bind(this))
    this.wsManager.on('onKick', this.handleKick.bind(this))
    this.wsManager.on('onPing', this.handlePing.bind(this))
    this.wsManager.on('onPong', this.handlePong.bind(this))
    this.wsManager.on('onErrorReport', this.handleErrorReport.bind(this))
    this.wsManager.on('onGetErrors', this.handleGetErrors.bind(this))
    this.wsManager.on('onClearErrors', this.handleClearErrors.bind(this))
    this.wsManager.on('onErrors', this.handleErrors.bind(this))
    this.wsManager.on('onMcpSubscribeErrors', this.handleMcpSubscribeErrors.bind(this))
    this.wsManager.on('onMcpErrorEvent', this.handleMcpErrorEvent.bind(this))
  }

  async connect() {
    try {
      await this.wsManager.connect()
      return true
    } catch (error) {
      this.errorHandler.handleError(error)
      throw error
    }
  }

  disconnect() {
    this.wsManager.disconnect()
  }

  // Packet sending methods
  send(packetName, data) {
    return this.wsManager.send(packetName, data)
  }

  // Chat methods
  sendChatMessage(message) {
    if (!this.chat) {
      throw new Error('Chat not initialized')
    }
    return this.chat.sendMessage(message)
  }

  sendCommand(command, ...args) {
    return this.send('command', [command, ...args])
  }

  // Player movement methods
  movePlayer(position, rotation = null) {
    if (!this.player) {
      throw new Error('Player not initialized')
    }
    return this.player.move(position, rotation)
  }

  teleportPlayer(position, rotation = null) {
    return this.send('playerTeleport', {
      networkId: this.player.id,
      position,
      rotation
    })
  }

  // Entity management methods
  getEntity(id) {
    return this.entities.get(id)
  }

  getEntities() {
    return Array.from(this.entities.values())
  }

  getEntitiesByType(type) {
    return this.getEntities().filter(entity => entity.type === type)
  }

  getApps() {
    return this.getEntitiesByType('app')
  }

  getPlayers() {
    return this.getEntitiesByType('player')
  }

  // Blueprint methods
  getBlueprint(id) {
    return this.blueprints.get(id)
  }

  getBlueprints() {
    return Array.from(this.blueprints.values())
  }

  // File upload methods
  async uploadFile(file) {
    if (!this.fileUploader) {
      throw new Error('File uploader not initialized')
    }
    return this.fileUploader.upload(file)
  }

  // Settings methods
  getSetting(key) {
    return this.settings[key]
  }

  getAllSettings() {
    return { ...this.settings }
  }

  // Packet handlers
  handleSnapshot(data) {
    console.log('Received snapshot:', data)

    this.serverTimeOffset = data.serverTime - Date.now()
    this.assetsUrl = data.assetsUrl
    this.apiUrl = data.apiUrl
    this.maxUploadSize = data.maxUploadSize

    // Initialize sub-managers
    if (!this.chat) {
      this.chat = new Chat(this)
    }
    if (!this.fileUploader) {
      this.fileUploader = new FileUploader(this.apiUrl, this.maxUploadSize)
    }

    // Load settings
    this.settings = data.settings || {}

    // Load blueprints
    this.blueprints.clear()
    if (data.blueprints) {
      data.blueprints.forEach(bp => {
        this.blueprints.set(bp.id, bp)
      })
    }

    // Load entities
    this.entities.clear()
    if (data.entities) {
      data.entities.forEach(entityData => {
        if (entityData.type === 'player') {
          const player = new Player(this, entityData)
          this.entities.set(entityData.id, player)
          if (entityData.id === data.id) {
            this.player = player
          }
        } else if (entityData.type === 'app') {
          const app = new App(this, entityData)
          this.entities.set(entityData.id, app)
        } else {
          const entity = new Entity(this, entityData)
          this.entities.set(entityData.id, entity)
        }
      })
    }

    this.collections = data.collections

    this.ready = true
    this.emit('ready', {
      player: this.player,
      entities: this.getEntities(),
      blueprints: this.getBlueprints(),
      settings: this.settings
    })
  }

  handleChatAdded(message) {
    if (this.chat) {
      this.chat.addMessage(message)
    }
    this.emit('chatMessage', message)
  }

  handleChatCleared() {
    if (this.chat) {
      this.chat.clear()
    }
    this.emit('chatCleared')
  }

  handleBlueprintAdded(blueprint) {
    this.blueprints.set(blueprint.id, blueprint)
    this.emit('blueprintAdded', blueprint)
  }

  handleBlueprintModified(change) {
    const blueprint = this.blueprints.get(change.id)
    if (blueprint) {
      Object.assign(blueprint, change)
      this.emit('blueprintModified', blueprint)
    }
  }

  handleEntityAdded(data) {
    let entity
    if (data.type === 'player') {
      entity = new Player(this, data)
    } else if (data.type === 'app') {
      entity = new App(this, data)
    } else {
      entity = new Entity(this, data)
    }

    this.entities.set(data.id, entity)
    this.emit('entityAdded', entity)
  }

  handleEntityModified(data) {
    const entity = this.entities.get(data.id)
    if (entity) {
      entity.update(data)
      this.emit('entityModified', entity)
    }
  }

  handleEntityRemoved(id) {
    const entity = this.entities.get(id)
    if (entity) {
      entity.destroy()
      this.entities.delete(id)
      this.emit('entityRemoved', entity)
    }
  }

  handleEntityEvent(event) {
    const [id, version, name, data] = event
    const entity = this.entities.get(id)
    if (entity) {
      entity.handleEvent(version, name, data)
      this.emit('entityEvent', { entity, name, data })
    }
  }

  handlePlayerTeleport(data) {
    const player = this.entities.get(data.networkId)
    if (player && player.isPlayer) {
      player.teleport(data)
      this.emit('playerTeleport', { player, data })
    }
  }

  handlePlayerPush(data) {
    const player = this.entities.get(data.networkId)
    if (player && player.isPlayer) {
      player.push(data.force)
      this.emit('playerPush', { player, data })
    }
  }

  handleSettingsModified(data) {
    this.settings[data.key] = data.value
    this.emit('settingsModified', data)
  }

  handleKick(code) {
    console.log(`Kicked from server: ${code}`)
    this.emit('kick', code)
    this.disconnect()
  }

  handleCommand(data) {
    this.emit('command', data)
  }

  handlePlayerSessionAvatar(data) {
    if (this.player) {
      this.player.sessionAvatar = data.avatar
      this.emit('playerSessionAvatar', data)
    }
  }

  handleLiveKitLevel(data) {
    this.emit('liveKitLevel', data)
  }

  handleMute(data) {
    this.emit('mute', data)
  }

  handleSpawnModified(data) {
    this.emit('spawnModified', data)
  }

  handleModifyRank(data) {
    if (this.player) {
      this.player.rank = data.rank
      this.emit('modifyRank', data)
    }
  }

  handlePing(time) {
    this.send('pong', Date.now())
    this.emit('ping', time)
  }

  handlePong(time) {
    const latency = Date.now() - time
    this.emit('pong', latency)
  }

  handleErrorReport(data) {
    this.errorHandler.handleError(new Error(data.message), { type: 'server', ...data })
    this.emit('errorReport', data)
  }

  handleGetErrors(data) {
    this.emit('getErrors', data)
  }

  handleClearErrors(data) {
    this.errorHandler.clear()
    this.emit('clearErrors', data)
  }

  handleErrors(data) {
    console.error('Server errors:', data)
    this.emit('serverErrors', data)
  }

  handleMcpSubscribeErrors(data) {
    this.emit('mcpSubscribeErrors', data)
  }

  handleMcpErrorEvent(data) {
    this.emit('mcpErrorEvent', data)
  }

  // Utility methods
  isReady() {
    return this.ready
  }

  isConnected() {
    return this.connected
  }

  getClientInfo() {
    return {
      connected: this.connected,
      ready: this.ready,
      playerCount: this.getPlayers().length,
      appCount: this.getApps().length,
      totalEntities: this.entities.size,
      blueprintCount: this.blueprints.size,
      url: this.url,
      serverTimeOffset: this.serverTimeOffset
    }
  }

  getStats() {
    const wsStats = this.wsManager.getStats()
    const errorStats = this.errorHandler.getErrorStats()

    return {
      websocket: wsStats,
      errors: errorStats,
      client: this.getClientInfo()
    }
  }
}