import { MessageHandler } from './plugins/core/MessageHandler.js'
import { StructuredLogger } from './utils/logging/index.js'

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

    this.ws.on('message', (packet) => this.onMessage(packet))
    this.ws.on('pong', () => this.onPong())
    this.ws.on('close', (e) => this.onClose(e))
  }

  send(name, data) {
    try {
      const packet = MessageHandler.encode(name, data)
      logger.info('Socket.send() encoding packet', { name, packetSize: packet.byteLength || packet.length, packetType: packet?.constructor?.name, wsType: typeof this.ws, wsReadyState: this.ws?.readyState })
      let binaryData = packet
      if (typeof Buffer !== 'undefined' && Buffer.isBuffer(packet)) {
        binaryData = packet
        logger.info('Socket.send() packet is Buffer', { name, size: packet.length })
      } else if (packet instanceof Uint8Array) {
        binaryData = Buffer.from(packet)
        logger.info('Socket.send() packet is Uint8Array, converting to Buffer', { name, size: packet.length })
      } else if (packet instanceof ArrayBuffer) {
        binaryData = Buffer.from(packet)
        logger.info('Socket.send() packet is ArrayBuffer, converting to Buffer', { name, size: packet.byteLength })
      } else {
        logger.error('Socket.send() packet is unknown type', { name, type: typeof packet, constructor: packet?.constructor?.name })
      }
      this.ws.send(binaryData)
      logger.info('Socket.send() packet sent to WebSocket', { name, sentType: typeof binaryData })
    } catch (err) {
      logger.error('Socket.send() failed', { name, error: err.message, errorType: err.constructor.name })
    }
  }

  sendPacket(packet) {
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(packet)) {
      this.ws.send(packet, { binary: true })
    } else if (packet instanceof Uint8Array) {
      this.ws.send(Buffer.from(packet), { binary: true })
    } else if (packet instanceof ArrayBuffer) {
      this.ws.send(Buffer.from(packet), { binary: true })
    } else {
      this.ws.send(packet)
    }
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

  onPong() {
    this.alive = true
  }

  onMessage(packet) {
    logger.info('Socket.onMessage() received packet', { socketId: this.id, size: packet?.length || 0, packetType: packet?.constructor?.name })
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

    let decodedPacket = packet
    if (packet.length > 2) {
      const firstTwoBytes = packet.slice(0, 2)
      const looksLikeSequence = firstTwoBytes[0] !== 0x92 && firstTwoBytes[0] !== 0x93 && firstTwoBytes[0] !== 0xdc && firstTwoBytes[0] !== 0xdd
      if (looksLikeSequence) {
        logger.info('Extracting sequence prefix from packet', { socketId: this.id, byte0: firstTwoBytes[0], byte1: firstTwoBytes[1] })
        decodedPacket = packet.slice(2)
      }
    }

    const [method, data] = MessageHandler.decode(decodedPacket)

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

  onClose(e) {
    this.closed = true
    this.disconnect(e?.code)
  }

  disconnect(code) {
    if (this.disconnected) return
    this.disconnected = true
    if (!this.closed && this.ws) {
      this.ws.terminate()
    }
    this.destroy()
    this.network.onDisconnect(this, code)
  }

  destroy() {
    if (this.ws) {
      this.ws.removeAllListeners('message')
      this.ws.removeAllListeners('pong')
      this.ws.removeAllListeners('close')
    }
  }
}
