const MESSAGE_SEQUENCE_MODULO = 65536

export class WebSocketMessageQueue {
  constructor(logger) {
    this.logger = logger
    this.messageQueue = []
    this.messageSequence = 0
    this.expectedSequence = 0
  }

  enqueue(packet) {
    this.messageQueue.push(packet)
    return this.messageQueue.length
  }

  dequeue() {
    return this.messageQueue.shift()
  }

  clear() {
    const count = this.messageQueue.length
    this.messageQueue = []
    return count
  }

  getPendingCount() {
    return this.messageQueue.length
  }

  flush(ws) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return 0
    }

    let sentCount = 0
    while (this.messageQueue.length > 0) {
      const packet = this.dequeue()
      ws.send(packet, { binary: true })
      sentCount++
    }
    return sentCount
  }

  handleQueuedMessages(ws) {
    return this.flush(ws)
  }

  getNextSequence() {
    this.messageSequence = (this.messageSequence + 1) % MESSAGE_SEQUENCE_MODULO
    return this.messageSequence
  }

  setExpectedSequence(sequence) {
    this.expectedSequence = (sequence + 1) % MESSAGE_SEQUENCE_MODULO
  }

  addSequenceToPacket(packet, sequence) {
    if (packet instanceof ArrayBuffer) {
      const view = new Uint8Array(packet)
      const seqBuffer = new Uint8Array(2)
      seqBuffer[0] = (sequence >> 8) & 0xFF
      seqBuffer[1] = sequence & 0xFF
      const combined = new Uint8Array(view.length + 2)
      combined.set(seqBuffer, 0)
      combined.set(view, 2)
      return combined.buffer
    }
    return packet
  }

  extractSequenceFromPacket(packet) {
    if (!(packet instanceof ArrayBuffer) || packet.byteLength < 2) {
      return null
    }
    const view = new Uint8Array(packet)
    const sequence = (view[0] << 8) | view[1]
    const payload = packet.slice(2)
    return { sequence, payload }
  }

  validateSequence(sequence) {
    if (this.expectedSequence > 0) {
      const gap = (sequence - this.expectedSequence + MESSAGE_SEQUENCE_MODULO) % MESSAGE_SEQUENCE_MODULO
      if (gap > 0 && gap < 256) {
        return { valid: true, gap }
      }
    }
    return { valid: true, gap: 0 }
  }

  reset() {
    this.messageSequence = 0
    this.expectedSequence = 0
  }
}
