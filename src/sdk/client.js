import { SnapshotEncoder } from '../netcode/SnapshotEncoder.js'
import { pack, unpack } from 'msgpackr'

export function createClient(config = {}) {
  const serverUrl = config.serverUrl || 'ws://localhost:8080'
  const onRender = config.onRender || (() => {})
  const onConnect = config.onConnect || (() => {})
  const onDisconnect = config.onDisconnect || (() => {})
  const onWorldState = config.onWorldState || (() => {})

  let ws = null
  let playerId = null
  let currentTick = 0
  let entities = new Map()
  let players = new Map()
  let connected = false

  function onMessage(raw) {
    try {
      let msg
      if (raw instanceof ArrayBuffer || (typeof Buffer !== 'undefined' && Buffer.isBuffer(raw))) {
        msg = unpack(raw instanceof ArrayBuffer ? new Uint8Array(raw) : raw)
      } else if (typeof raw === 'string') {
        msg = JSON.parse(raw)
      } else {
        return
      }

      if (msg.t === 1 || msg.type === 'player_assigned') {
        playerId = msg.id || msg.playerId
        currentTick = msg.tick
        onConnect({ playerId, tick: currentTick })
      } else if (msg.t === 2 || msg.type === 'world_state') {
        const decoded = SnapshotEncoder.decode(msg.data)
        for (const ent of decoded.entities) entities.set(ent.id, ent)
        onWorldState(Array.from(entities.values()))
      } else if (msg.t === 6 || msg.type === 'snapshot') {
        const decoded = SnapshotEncoder.decode(msg.data)
        currentTick = decoded.tick
        for (const p of decoded.players) players.set(p.id, p)
        for (const ent of decoded.entities) entities.set(ent.id, ent)
        onRender(Array.from(entities.values()), Array.from(players.values()))
      } else if (msg.t === 5 || msg.type === 'player_disconnected') {
        players.delete(msg.id || msg.playerId)
      }
    } catch (e) {}
  }

  function sendInput(input) {
    if (!ws || !connected) return
    ws.send(pack({ t: 3, i: input }))
  }

  return {
    get playerId() { return playerId },
    get tick() { return currentTick },
    get entities() { return entities },
    get players() { return players },
    get isConnected() { return connected },

    connect() {
      return new Promise((resolve, reject) => {
        try {
          ws = new WebSocket(serverUrl)
          ws.binaryType = 'arraybuffer'
          ws.onopen = () => { connected = true; resolve() }
          ws.onmessage = (event) => onMessage(event.data)
          ws.onclose = () => { connected = false; onDisconnect() }
          ws.onerror = (err) => reject(err)
        } catch (e) { reject(e) }
      })
    },

    connectNode(WebSocketImpl) {
      return new Promise((resolve, reject) => {
        try {
          ws = new WebSocketImpl(serverUrl)
          ws.on('open', () => { connected = true; resolve() })
          ws.on('message', (data) => onMessage(data))
          ws.on('close', () => { connected = false; onDisconnect() })
          ws.on('error', (err) => reject(err))
        } catch (e) { reject(e) }
      })
    },

    sendInput,

    interact(entityId) {
      if (!ws || !connected) return
      ws.send(pack({ t: 4, eid: entityId }))
    },

    disconnect() {
      if (ws) { connected = false; ws.close() }
    },

    getEntity(id) { return entities.get(id) || null },
    getPlayer(id) { return players.get(id) || null }
  }
}
