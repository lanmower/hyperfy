import { MessageHandler } from '../../plugins/core/MessageHandler.js'
import { StructuredLogger } from '../../utils/logging/index.js'
import { WebSocketValidator } from '../../validation/WebSocketValidator.js'

const logger = new StructuredLogger('SocketManager')

const wsValidator = new WebSocketValidator()

export class SocketManager {
  constructor(network) {
    this.network = network
    this.circuitBreakerManager = null
    this.messageLimiters = new Map()
    this.connectionLimiter = wsValidator.createConnectionLimiter()
  }

  setCircuitBreakerManager(manager) {
    this.circuitBreakerManager = manager
  }

  send(name, data, ignoreSocketId) {
    const validation = wsValidator.validatePacket(name, data)
    if (!validation.valid) {
      logger.error('WebSocket send validation failed', { name, errors: validation.errors })
      return
    }

    const executeSend = async () => {
      const compressed = this.network.compressor.compress(data)
      const packet = MessageHandler.encode(name, compressed)
      this.network.sockets.forEach(socket => {
        if (socket.id === ignoreSocketId) return
        const sequencedPacket = this.wrapWithSequence(packet, socket)
        socket.sendPacket(sequencedPacket)
      })
    }

    if (this.circuitBreakerManager && this.circuitBreakerManager.has('websocket')) {
      this.circuitBreakerManager.execute('websocket', executeSend).catch(err => {
        if (err.code === 'CIRCUIT_OPEN') {
          logger.error('WebSocket circuit open, broadcast skipped', { name })
        } else {
          logger.error('Broadcast error', { name, error: err.message })
        }
      })
    } else {
      executeSend().catch(err => {
        logger.error('Broadcast error', { name, error: err.message })
      })
    }
  }

  wrapWithSequence(packet, socket) {
    if (!packet || !(packet instanceof ArrayBuffer || Buffer.isBuffer(packet))) return packet
    socket._sendSequence = ((socket._sendSequence || 0) + 1) % 65536
    const seq = socket._sendSequence
    const seqBuffer = Buffer.allocUnsafe(2)
    seqBuffer[0] = (seq >> 8) & 0xFF
    seqBuffer[1] = seq & 0xFF
    return Buffer.concat([seqBuffer, Buffer.isBuffer(packet) ? packet : Buffer.from(packet)])
  }

  sendTo(socketId, name, data) {
    const socket = this.network.sockets.get(socketId)
    socket?.send(name, data)
  }

  checkSockets() {
    const dead = []
    this.network.sockets.forEach(socket => {
      if (!socket.alive) {
        dead.push(socket)
      } else {
        socket.ping()
      }
    })
    dead.forEach(socket => socket.disconnect())
  }

  validateMessage(socketId, message) {
    const validation = wsValidator.validateMessage(message)
    if (!validation.valid) {
      logger.warn('WebSocket message validation failed', { socketId, errors: validation.errors })
      return false
    }

    if (!this.messageLimiters.has(socketId)) {
      this.messageLimiters.set(socketId, wsValidator.createRateLimiter())
    }

    const limiter = this.messageLimiters.get(socketId)
    const rateCheck = limiter.check()

    if (!rateCheck.allowed) {
      logger.warn('WebSocket rate limit exceeded', { socketId, count: rateCheck.count, limit: rateCheck.limit })
      return false
    }

    return true
  }

  cleanupSocket(socketId) {
    this.messageLimiters.delete(socketId)
  }

  validateConnection(ip) {
    const result = this.connectionLimiter.add(ip)
    if (!result.allowed) {
      logger.warn('WebSocket connection limit reached', { ip, count: result.count, limit: result.limit })
    }
    return result.allowed
  }

  removeConnection(ip) {
    this.connectionLimiter.remove(ip)
  }

  getWebSocketStats() {
    return {
      activeConnections: this.network.sockets.size,
      rateLimiters: this.messageLimiters.size,
      connectionsByIP: this.connectionLimiter.getAll(),
    }
  }
}
