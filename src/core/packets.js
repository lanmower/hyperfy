import { Packr } from 'msgpackr'
import { PACKET_NAMES } from './packets.constants.js'
import { StructuredLogger } from './utils/logging/index.js'

const logger = new StructuredLogger('packets')
const packr = new Packr({ useRecords: false })

const names = PACKET_NAMES

const byName = {}
const byId = {}

let ids = -1

for (const name of names) {
  const id = ++ids
  const info = {
    id,
    name,
    method: `on${capitalize(name)}`, // eg 'connect' -> 'onConnect'
  }
  byName[name] = info
  byId[id] = info
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function writePacket(name, data) {
  const info = byName[name]
  if (!info) throw new Error(`writePacket failed: ${name} (name not found)`)
  const packet = packr.pack([info.id, data])
  return packet
}

export function readPacket(packet) {
  try {
    const isArrayBuffer = packet instanceof ArrayBuffer
    const isBuffer = typeof Buffer !== 'undefined' && Buffer.isBuffer(packet)
    if (!isArrayBuffer && !isBuffer) {
      logger.error('readPacket security error: invalid packet type', { type: typeof packet })
      return [null, null]
    }
    const unpacked = packr.unpack(packet)
    if (!Array.isArray(unpacked) || unpacked.length !== 2) {
      logger.error('readPacket security error: invalid packet structure', { length: unpacked?.length })
      return [null, null]
    }
    const [id, data] = unpacked
    if (typeof id !== 'number') {
      logger.error('readPacket security error: id not number', { type: typeof id })
      return [null, null]
    }
    const info = byId[id]
    if (!info) {
      logger.error('readPacket security error: unknown id', { id })
      return [null, null]
    }
    return [info.method, data]
  } catch (err) {
    logger.error('readPacket decode error', { error: err.message })
    return [null, null]
  }
}
