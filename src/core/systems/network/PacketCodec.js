import { Packr } from 'msgpackr'
import { PACKET_NAMES } from '../../packets.constants.js'
import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('PacketCodec')

const packr = new Packr({ structuredClone: true })

const byName = {}
const byId = {}

let ids = -1

for (const name of PACKET_NAMES) {
  const id = ++ids
  const info = {
    id,
    name,
    method: `on${capitalize(name)}`,
  }
  byName[name] = info
  byId[id] = info
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export class PacketCodec {
  static encode(name, data) {
    const info = byName[name]
    if (!info) throw new Error(`PacketCodec.encode failed: ${name} (name not found)`)
    return packr.pack([info.id, data])
  }

  static decode(packet) {
    try {
      if (!(packet instanceof ArrayBuffer)) {
        logger.error('Packet decode security error', { issue: 'packet is not ArrayBuffer', type: typeof packet })
        return []
      }

      const unpacked = packr.unpack(packet)

      if (!Array.isArray(unpacked)) {
        logger.error('Packet decode security error', { issue: 'unpacked packet is not array', type: typeof unpacked })
        return []
      }

      if (unpacked.length !== 2) {
        logger.error('Packet decode security error', { issue: 'invalid packet structure', expected: '[id, data]', actual: unpacked.length })
        return []
      }

      const [id, data] = unpacked

      if (typeof id !== 'number') {
        logger.error('Packet decode security error', { issue: 'packet id is not number', type: typeof id })
        return []
      }

      const info = byId[id]
      if (!info) {
        logger.error('Packet decode security error', { issue: 'unknown packet id', id })
        return []
      }

      return [info.method, data]
    } catch (err) {
      logger.error('Packet decode error', { error: err.message })
      return []
    }
  }

  static getPacketInfo(name) {
    return byName[name]
  }

  static getPacketName(id) {
    return byId[id]?.name
  }
}
