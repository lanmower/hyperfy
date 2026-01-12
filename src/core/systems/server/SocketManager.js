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
      const toSend = data
      const packet = MessageHandler.encode(name, toSend)
      this.network.sockets.forEach(socket => {
        if (socket.id === ignoreSocketId) return
        socket.sendPacket(packet)
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
    if (!packet) return packet
    const isArrayBuffer = packet instanceof ArrayBuffer
    const isBuffer = Buffer.isBuffer(packet)
    if (!isArrayBuffer && !isBuffer) return packet

    socket._sendSequence = ((socket._sendSequence || 0) + 1) % 65536
    const seq = socket._sendSequence
    const seqArray = new Uint8Array(2)
    seqArray[0] = (seq >> 8) & 0xFF
    seqArray[1] = seq & 0xFF

    const packetArray = isBuffer ? new Uint8Array(packet) : new Uint8Array(packet)
    const combined = new Uint8Array(seqArray.length + packetArray.length)
    combined.set(seqArray, 0)
    combined.set(packetArray, seqArray.length)
    return Buffer.from(combined)
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
