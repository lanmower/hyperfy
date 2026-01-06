import { Packr } from 'msgpackr'
import { PACKET_NAMES } from '../../packets.constants.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('MessageHandler')
const packr = new Packr({ useRecords: false })

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

export class MessageHandler {
  static encode(name, data) {
    const info = byName[name]
    if (!info) throw new Error(`MessageHandler.encode failed: ${name}`)
    return packr.pack([info.id, data])
  }

  static decode(packet) {
    try {
      const isArrayBuffer = packet instanceof ArrayBuffer
      const isBuffer = typeof Buffer !== 'undefined' && Buffer.isBuffer(packet)
      if (!isArrayBuffer && !isBuffer) {
        logger.error('Decode security error: not ArrayBuffer or Buffer', { type: typeof packet, isAB: isArrayBuffer, isBuf: isBuffer })
        return [null, null]
      }

      const unpacked = packr.unpack(packet)

      if (!Array.isArray(unpacked) || unpacked.length !== 2) {
        logger.error('Decode security error: invalid packet structure', { length: unpacked?.length })
        return [null, null]
      }

      const [id, data] = unpacked

      if (typeof id !== 'number') {
        logger.error('Decode security error: id not number', { type: typeof id })
        return [null, null]
      }

      const info = byId[id]
      if (!info) {
        logger.error('Decode security error: unknown id', { id })
        return [null, null]
      }

      return [info.method, data]
    } catch (err) {
      logger.error('Decode error', { error: err.message })
      return [null, null]
    }
  }

  static getInfo(name) {
    return byName[name]
  }

  static getName(id) {
    return byId[id]?.name
  }
}
