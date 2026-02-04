import { pack, unpack } from 'msgpackr'
import { msgName } from './MessageTypes.js'

export class Codec {
  constructor() {
    this.bytesSent = 0
    this.bytesReceived = 0
    this.messagesSent = 0
    this.messagesReceived = 0
    this.sendSequence = 0
  }

  encode(type, payload) {
    const seq = this.sendSequence++ & 0xFFFF
    const body = pack(payload)
    const frame = Buffer.alloc(3 + body.length)
    frame.writeUInt8(type, 0)
    frame.writeUInt16BE(seq, 1)
    body.copy(frame, 3)
    this.bytesSent += frame.length
    this.messagesSent++
    return frame
  }

  decode(buffer) {
    const buf = Buffer.isBuffer(buffer)
      ? buffer
      : Buffer.from(buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer)
    if (buf.length < 3) return null
    const type = buf.readUInt8(0)
    const seq = buf.readUInt16BE(1)
    const payload = buf.length > 3 ? unpack(buf.slice(3)) : null
    this.bytesReceived += buf.length
    this.messagesReceived++
    return { type, seq, payload }
  }

  getStats() {
    return {
      bytesSent: this.bytesSent,
      bytesReceived: this.bytesReceived,
      messagesSent: this.messagesSent,
      messagesReceived: this.messagesReceived,
      sendSequence: this.sendSequence
    }
  }

  resetStats() {
    this.bytesSent = 0
    this.bytesReceived = 0
    this.messagesSent = 0
    this.messagesReceived = 0
  }
}
