import { MessageHandler } from '../../plugins/core/MessageHandler.js'
import { SnapshotCodec } from '../network/SnapshotCodec.js'
import { Socket } from '../../Socket.js'
import { uuid } from '../../utils.js'
import { createJWT, readJWT } from '../../utils/helpers/crypto.js'
import { EVENT } from '../../constants/EventNames.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('PlayerConnectionManager')
const env = typeof process !== 'undefined' && process.env ? process.env : {}
const HEALTH_MAX = 100

export class PlayerConnectionManager {
  constructor(serverNetwork) {
    this.serverNetwork = serverNetwork
  }

  async onConnection(ws, params) {
    try {
      const playerLimit = this.serverNetwork.settings.playerLimit
      const { isNumber } = await import('../../utils/helpers/typeChecks.js')
      if (isNumber(playerLimit) && playerLimit > 0 && this.serverNetwork.sockets.size >= playerLimit) {
        const packet = MessageHandler.encode('kick', 'player_limit')
        ws.send(packet, { binary: true })
        ws.close()
        return
      }

      let authToken = params.authToken
      let name = params.name
      let avatar = params.avatar

      let user
      if (authToken) {
        try {
          const { userId } = await readJWT(authToken)
          user = await this.serverNetwork.persistence.loadUser(userId)
        } catch (err) {
          logger.error('Failed to read auth token', { error: err.message })
        }
      }
      if (!user) {
        user = {
          id: uuid(),
          name: 'Anonymous',
          avatar: null,
          rank: 0,
        }
        logger.info('Creating anonymous user', { userId: user.id })
        try {
          await this.serverNetwork.persistence.saveUser(user.id, user)
          logger.info('Anonymous user saved successfully', { userId: user.id })
        } catch (err) {
          logger.error('Failed to save anonymous user', { userId: user.id, error: err.message, stack: err.stack })
          throw err
        }
        authToken = await createJWT({ userId: user.id })
      }

       const livekit = this.serverNetwork.livekit ? await this.serverNetwork.livekit.serialize(user.id) : null

       // ATOMIC: Check socket existence BEFORE creation to prevent race condition
       if (this.serverNetwork.sockets.has(user.id)) {
         logger.error('Duplicate socket connection attempt - race condition prevented', { userId: user.id })
         const packet = MessageHandler.encode('kick', 'duplicate_user')
         ws.send(packet, { binary: true })
         ws.close()
         return
       }

       const socket = new Socket({ id: user.id, ws, network: this.serverNetwork })

       socket.player = this.serverNetwork.entities.add(
        {
          id: user.id,
          type: 'player',
          position: this.serverNetwork.spawn.position.slice(),
          quaternion: this.serverNetwork.spawn.quaternion.slice(),
          userId: socket.id,
          name: name || user.name,
          health: HEALTH_MAX,
          avatar: user.avatar || this.serverNetwork.settings.avatar?.url || 'asset://avatar.vrm',
          sessionAvatar: avatar || null,
          rank: user.rank,
          enteredAt: Date.now(),
        },
        true
      )

      const snapshot = {
        id: socket.id,
        serverTime: performance.now(),
        assetsUrl: env.PUBLIC_ASSETS_URL || '',
        apiUrl: env.PUBLIC_API_URL || '',
        maxUploadSize: parseInt(env.PUBLIC_MAX_UPLOAD_SIZE, 10) || 0,
        collections: this.serverNetwork.collections.serialize(),
        settings: this.serverNetwork.settings.serialize(),
        chat: this.serverNetwork.chat.serialize(),
        blueprints: this.serverNetwork.blueprints.serialize(),
        entities: this.serverNetwork.entities.serialize(),
        livekit,
        authToken,
        hasAdminCode: !!env.ADMIN_CODE,
      }

      // Register socket BEFORE sending snapshot to ensure it's ready
      this.serverNetwork.sockets.set(socket.id, socket)

      logger.info('Sending snapshot to client', { socketId: socket.id, entityCount: this.serverNetwork.entities.size })
      try {
        // Send snapshot through Socket wrapper (not raw ws) to ensure proper ArrayBuffer conversion
        socket.send('snapshot', snapshot)
        logger.info('Snapshot sent successfully', { socketId: socket.id })
      } catch (err) {
        logger.error('Failed to send snapshot', { socketId: socket.id, error: err.message })
      }

      // Emit event AFTER full initialization and socket registration
      this.serverNetwork.world.emit(EVENT.game.enter, { playerId: socket.player.data.id })
    } catch (err) {
      logger.error('Player connection failed', { error: err.message })
    }
  }

  onModifyRank(socket, data) {
    if (!socket.player) return
    if (!socket.player.isAdmin()) return
    const { playerId, rank } = data
    if (!playerId) return
    if (typeof rank !== 'number') return
    const player = this.serverNetwork.entities.get(playerId)
    if (!player || !player.isPlayer) return
    player.modify({ rank })
    this.serverNetwork.send('entityModified', { id: playerId, rank })
    this.serverNetwork.persistence.updateUserRank(playerId, rank)
  }

  onKick(socket, playerId) {
    if (!socket.player) return
    const player = this.serverNetwork.entities.get(playerId)
    if (!player) return
    if (socket.player.data.rank <= player.data.rank) return
    const tSocket = this.serverNetwork.sockets.get(playerId)
    if (!tSocket) return
    tSocket.send('kick', 'moderation')
    tSocket.disconnect()
  }

  onMute(socket, data) {
    if (!socket.player) return
    const player = this.serverNetwork.entities.get(data.playerId)
    if (!player) return
    if (socket.player.data.rank <= player.data.rank) return
    this.serverNetwork.livekit.setMuted(data.playerId, data.muted)
  }

  onDisconnect(socket, code) {
    if (socket.mcpErrorListener && this.serverNetwork.errorMonitor) {
      this.serverNetwork.errorMonitor.listeners.delete(socket.mcpErrorListener)
    }
    if (socket.mcpErrorSubscription) {
      socket.mcpErrorSubscription.active = false
    }

    this.serverNetwork.livekit.clearModifiers(socket.id)
    if (socket.player) {
      socket.player.destroy(true)
      this.serverNetwork.world.emit('exit', { playerId: socket.player.data.id })
    }
    this.serverNetwork.sockets.delete(socket.id)
  }

  onPlayerTeleport(socket, data) {
    if (!data || !data.networkId) return
    this.serverNetwork.sendTo(data.networkId, 'playerTeleport', data)
  }

  onPlayerPush(socket, data) {
    if (!data || !data.networkId) return
    this.serverNetwork.sendTo(data.networkId, 'playerPush', data)
  }

  onPlayerSessionAvatar(socket, data) {
    if (!data || !data.avatar) return
    this.serverNetwork.sendTo(data.networkId, 'playerSessionAvatar', data.avatar)
  }
}
