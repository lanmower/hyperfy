import { StructuredLogger } from '../utils/logging/index.js'
import { PacketDefinition } from './protocol/PacketDefinition.js'

const logger = new StructuredLogger('NetworkPacket')

export class NetworkPacket {
  constructor(name, data = null, version = PacketDefinition.PROTOCOL_VERSION) {
    const validation = PacketDefinition.validate(name, data)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    this.name = name
    this.data = data
    this.version = version
    this.definition = validation.definition
    this.timestamp = Date.now()
    this.id = this.definition.id
  }

  static create(name, data) {
    return new NetworkPacket(name, data)
  }

  static fromEncoded(id, data, version = PacketDefinition.PROTOCOL_VERSION) {
    const definition = PacketDefinition.getById(id)
    if (!definition) {
      throw new Error(`Invalid packet ID: ${id}`)
    }

    const packet = Object.create(NetworkPacket.prototype)
    packet.name = definition.name
    packet.data = data
    packet.version = version
    packet.definition = definition
    packet.timestamp = Date.now()
    packet.id = id

    return packet
  }

  encode() {
    return {
      version: this.version,
      id: this.id,
      data: this.data,
      timestamp: this.timestamp,
    }
  }

  toJSON() {
    return this.encode()
  }

  getSize() {
    if (!this.data) return 0
    return JSON.stringify(this.data).length
  }

  isValid() {
    return PacketDefinition.validate(this.name, this.data).valid
  }

  getHandler() {
    return this.definition?.handler || null
  }

  canBeSentTo(isServer) {
    return PacketDefinition.isValidDirection(this.name, isServer)
  }

  toString() {
    return `NetworkPacket[${this.name}:${this.id}, size: ${this.getSize()}B, v${this.version}]`
  }
}

export class NetworkPacketCodec {
  static encode(packet, compressedPayload = null) {
    if (!(packet instanceof NetworkPacket)) {
      throw new Error('Expected NetworkPacket instance')
    }

    return {
      v: packet.version,
      id: packet.id,
      p: compressedPayload || packet.data,
      t: packet.timestamp,
    }
  }

  static decode(encoded) {
    if (!encoded || typeof encoded !== 'object') {
      logger.error('Invalid encoded packet', { type: typeof encoded })
      return null
    }

    const { v, id, p, t } = encoded

    if (typeof id !== 'number') {
      logger.error('Invalid packet ID', { id })
      return null
    }

    try {
      return NetworkPacket.fromEncoded(id, p, v)
    } catch (error) {
      logger.error('Packet decode failed', { id, error: error.message })
      return null
    }
  }

  static createBatch(packets) {
    if (!Array.isArray(packets)) {
      throw new Error('Expected array of packets')
    }

    return packets.map(p => this.encode(p))
  }

  static decodeBatch(encodedPackets) {
    if (!Array.isArray(encodedPackets)) {
      logger.error('Invalid batch format')
      return []
    }

    return encodedPackets
      .map(ep => this.decode(ep))
      .filter(p => p !== null)
  }
}

export class NetworkPacketBuilder {
  constructor(name) {
    this.name = name
    this.data = {}
  }

  set(key, value) {
    this.data[key] = value
    return this
  }

  setMultiple(data) {
    this.data = { ...this.data, ...data }
    return this
  }

  build() {
    return new NetworkPacket(this.name, Object.keys(this.data).length ? this.data : null)
  }

  clear() {
    this.data = {}
    return this
  }

  getSize() {
    return JSON.stringify(this.data).length
  }
}
