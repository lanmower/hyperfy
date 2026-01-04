import { Packr } from 'msgpackr'
import { PACKET_NAMES } from './packets.constants.js'
import { StructuredLogger } from './utils/logging/index.js'

const logger = new StructuredLogger('packets')
const packr = new Packr()

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
      throw new Error(`readPacket failed: invalid packet type (expected ArrayBuffer or Buffer, got ${typeof packet})`)
    }
    const unpacked = packr.unpack(packet)
    if (!Array.isArray(unpacked) || unpacked.length < 2) {
      throw new Error(`readPacket failed: invalid packet format (expected array with 2+ elements, got ${typeof unpacked}${Array.isArray(unpacked) ? ` length ${unpacked.length}` : ''})`)
    }
    const [id, data] = unpacked
    if (typeof id !== 'number') {
      throw new Error(`readPacket failed: invalid packet id type (expected number, got ${typeof id})`)
    }
    const info = byId[id]
    if (!info) throw new Error(`readPacket failed: ${id} (id not found)`)
    return [info.method, data]
  } catch (err) {
    logger.error('Failed to read packet', { error: err.message })
    return []
  }
}
