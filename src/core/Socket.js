import { MessageHandler } from './plugins/core/MessageHandler.js'
import { StructuredLogger } from 'utils/logging/index.js'

const MAX_MESSAGE_SIZE = 1024 * 1024
const INVALID_MESSAGE_THRESHOLD = 10
const INVALID_MESSAGE_WINDOW = 60000
const logger = new StructuredLogger('Socket')

export class Socket {
  constructor({ id, ws, network, player }) {
    this.id = id
    this.ws = ws
    this.network = network

    this.player = player

    this.alive = true
    this.closed = false
    this.disconnected = false

    this.invalidMessageCount = 0
    this.invalidMessageWindow = Date.now()

    this.ws.on('message', this.onMessage)
    this.ws.on('pong', this.onPong)
    this.ws.on('close', this.onClose)
  }

  send(name, data) {
    const packet = MessageHandler.encode(name, data)
    this.ws.send(packet)
  }

  sendPacket(packet) {
    this.ws.send(packet)
  }

  ping() {
    this.alive = false
    this.ws.ping()
  }


  validateMessage(packet) {
    if (!Buffer.isBuffer(packet)) {
      logger.error('Invalid message type from socket', { socketId: this.id, expectedType: 'Buffer', actualType: typeof packet })
      return { valid: false, error: 'Invalid message type' }
    }

    if (packet.length > MAX_MESSAGE_SIZE) {
      logger.error('Message size exceeds limit from socket', { socketId: this.id, size: packet.length, limit: MAX_MESSAGE_SIZE })
      return { valid: false, error: 'Message too large' }
    }

    if (!packet.length) {
      logger.error('Empty message from socket', { socketId: this.id })
      return { valid: false, error: 'Empty message' }
    }

    return { valid: true }
  }

  trackInvalidMessage() {
    const now = Date.now()
    if (now - this.invalidMessageWindow > INVALID_MESSAGE_WINDOW) {
      this.invalidMessageCount = 0
      this.invalidMessageWindow = now
    }

    this.invalidMessageCount++
    if (this.invalidMessageCount > INVALID_MESSAGE_THRESHOLD) {
      logger.error('Invalid message threshold exceeded for socket', { socketId: this.id, count: this.invalidMessageCount })
      return true
    }

    return false
  }

  onPong = () => {
    this.alive = true
  }

  onMessage = packet => {
    const validation = this.validateMessage(packet)
    if (!validation.valid) {
      logger.error('Message validation failed for socket', {
        socketId: this.id,
        error: validation.error,
        playerId: this.player?.data?.id,
        size: packet?.length || 0
      })

      if (this.trackInvalidMessage()) {
        logger.error('Too many invalid messages from socket, disconnecting', { socketId: this.id })
        this.ws.close(1008, 'Invalid message threshold exceeded')
        return
      }

      return
    }

    const [method, data] = MessageHandler.decode(packet)

    if (!method) {
      logger.error('Failed to decode packet from socket', { socketId: this.id })

      if (this.trackInvalidMessage()) {
        logger.error('Too many decode failures from socket, disconnecting', { socketId: this.id })
        this.ws.close(1008, 'Decode failure threshold exceeded')
        return
      }

      return
    }

    this.network.enqueue(this, method, data)
  }

  onClose = e => {
    this.closed = true
    this.disconnect(e?.code)
  }

  disconnect(code) {
    if (!this.closed) return this.ws.terminate()
    if (this.disconnected) return
    this.disconnected = true
    this.network.onDisconnect(this, code)
  }
}
