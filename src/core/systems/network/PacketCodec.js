import { Packr } from 'msgpackr'
import { PACKET_NAMES } from '../../packets.constants.js'

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
      const [id, data] = packr.unpack(packet)
      const info = byId[id]
      if (!info) throw new Error(`PacketCodec.decode failed: ${id} (id not found)`)
      return [info.method, data]
    } catch (err) {
      console.error(err)
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
