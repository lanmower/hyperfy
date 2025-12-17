import { uuid } from '../../utils.js'
import { serializeForNetwork } from '../../schemas/ChatMessage.schema.js'
import { errorObserver } from '../../../server/services/ErrorObserver.js'

export class PacketHandlers {
  constructor(serverNetwork) {
    this.net = serverNetwork
  }

  onChatAdded = async (socket, msg) => {
    this.net.chat.add(msg, false)
    this.net.send('chatAdded', msg, socket.id)
  }

  onCommand = (socket, args) => {
    this.net.commandHandler.execute(socket, args)
  }

  onModifyRank = async (socket, data) => {
    if (!socket.player.isAdmin()) return
    const { playerId, rank } = data
    if (!playerId) return
    if (typeof rank !== 'number') return
    const player = this.net.entities.get(playerId)
    if (!player || !player.isPlayer) return
    player.modify({ rank })
    this.net.send('entityModified', { id: playerId, rank })
    await this.net.persistence.updateUserRank(playerId, rank)
  }

  onKick = (socket, playerId) => {
    const player = this.net.entities.get(playerId)
    if (!player) return
    if (socket.player.data.rank <= player.data.rank) return
    const tSocket = this.net.sockets.get(playerId)
    tSocket.send('kick', 'moderation')
    tSocket.disconnect()
  }

  onMute = (socket, data) => {
    const player = this.net.entities.get(data.playerId)
    if (!player) return
    if (socket.player.data.rank <= player.data.rank) return
    this.net.livekit.setMuted(data.playerId, data.muted)
  }

  onBlueprintAdded = (socket, blueprint) => {
    if (!socket.player.isBuilder()) {
      return console.error('player attempted to add blueprint without builder permission')
    }
    this.net.blueprints.add(blueprint)
    this.net.send('blueprintAdded', blueprint, socket.id)
    this.net.dirtyBlueprints.add(blueprint.id)
  }

  onBlueprintModified = (socket, data) => {
    if (!socket.player.isBuilder()) {
      return console.error('player attempted to modify blueprint without builder permission')
    }
    const blueprint = this.net.blueprints.get(data.id)
    if (data.version > blueprint.version) {
      this.net.blueprints.modify(data)
      this.net.send('blueprintModified', data, socket.id)
      this.net.dirtyBlueprints.add(data.id)
    }
    else {
      socket.send('blueprintModified', blueprint)
    }
  }

  onEntityAdded = (socket, data) => {
    if (!socket.player.isBuilder()) {
      return console.error('player attempted to add entity without builder permission')
    }
    const entity = this.net.entities.add(data)
    this.net.send('entityAdded', data, socket.id)
    if (entity.isApp) this.net.dirtyApps.add(entity.data.id)
  }

  onEntityModified = async (socket, data) => {
    const entity = this.net.entities.get(data.id)
    if (!entity) return console.error('onEntityModified: no entity found', data)
    entity.modify(data)
    this.net.send('entityModified', data, socket.id)
    if (entity.isApp) {
      this.net.dirtyApps.add(entity.data.id)
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
        await this.net.persistence.updateUserData(entity.data.userId, changes)
      }
    }
  }

  onEntityEvent = (socket, event) => {
    const [id, version, name, data] = event
    const entity = this.net.entities.get(id)
    entity?.onEvent(version, name, data, socket.id)
  }

  onEntityRemoved = (socket, id) => {
    if (!socket.player.isBuilder()) return console.error('player attempted to remove entity without builder permission')
    const entity = this.net.entities.get(id)
    this.net.entities.remove(id)
    this.net.send('entityRemoved', id, socket.id)
    if (entity && entity.isApp) this.net.dirtyApps.add(id)
  }

  onSettingsModified = (socket, data) => {
    if (!socket.player.isBuilder())
      return console.error('player attempted to modify settings without builder permission')
    this.net.settings.set(data.key, data.value)
    this.net.send('settingsModified', data, socket.id)
  }

  onSpawnModified = async (socket, op) => {
    if (!socket.player.isBuilder()) {
      return console.error('player attempted to modify spawn without builder permission')
    }
    const player = socket.player
    if (op === 'set') {
      this.net.spawn = { position: player.data.position.slice(), quaternion: player.data.quaternion.slice() }
    } else if (op === 'clear') {
      this.net.spawn = { position: [0, 0, 0], quaternion: [0, 0, 0, 1] }
    } else {
      return
    }
    const data = JSON.stringify(this.net.spawn)
    await this.net.persistence.setConfig('spawn', data)
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
    this.net.sendTo(data.networkId, 'playerTeleport', data)
  }

  onPlayerPush = (socket, data) => {
    this.net.sendTo(data.networkId, 'playerPush', data)
  }

  onPlayerSessionAvatar = (socket, data) => {
    this.net.sendTo(data.networkId, 'playerSessionAvatar', data.avatar)
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

    if (this.net.errorMonitor) {
      this.net.errorMonitor.receiveClientError({
        error: errorEvent,
        ...metadata
      })
    }

    this.net.sockets.forEach(mcpSocket => {
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

    if (this.net.errorMonitor) {
      this.net.errorMonitor.receiveClientError({
        error: data.error || data,
        ...metadata
      })
    }

    this.net.sockets.forEach(mcpSocket => {
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
    if (!this.net.errorMonitor) return

    const errorListener = (event, errorData) => {
      if (event === 'error' || event === 'critical') {
        socket.send('mcpErrorEvent', errorData)
      }
    }

    socket.mcpErrorListener = errorListener
    socket.mcpErrorSubscription = { active: true, options }
    this.net.errorMonitor.listeners.add(errorListener)
  }

  onGetErrors = (socket, options = {}) => {
    if (!this.net.errorMonitor) {
      socket.send('errors', { errors: [], stats: null })
      return
    }
    const errors = this.net.errorMonitor.getErrors(options)
    const stats = this.net.errorMonitor.getStats()
    socket.send('errors', { errors, stats })
  }

  onClearErrors = (socket) => {
    if (!this.net.errorMonitor) {
      socket.send('clearErrors', { cleared: 0 })
      return
    }
    const count = this.net.errorMonitor.clearErrors()
    socket.send('clearErrors', { cleared: count })
  }

  onFileUpload = async (socket, data) => {
    try {
      const { buffer, filename, mimeType, metadata } = data
      const bufferData = Buffer.from(buffer)

      const result = await this.net.fileUploader.uploadFile(bufferData, filename, {
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
      const exists = await this.net.fileUploader.checkExists(hash)
      const record = exists ? await this.net.fileStorage.getRecord(hash) : null

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
      const stats = this.net.fileUploader.getStats()
      const storageStats = await this.net.fileStorage.getStats()

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
    if (socket.mcpErrorListener && this.net.errorMonitor) {
      this.net.errorMonitor.listeners.delete(socket.mcpErrorListener)
    }
    if (socket.mcpErrorSubscription) {
      socket.mcpErrorSubscription.active = false
    }

    this.net.livekit.clearModifiers(socket.id)
    socket.player.destroy(true)
    this.net.sockets.delete(socket.id)
    this.net.events.emit('exit', { playerId: socket.player.data.id })
  }
}
