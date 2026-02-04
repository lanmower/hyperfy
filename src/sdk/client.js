import { SnapshotEncoder } from '../netcode/SnapshotEncoder.js'

export function createClient(config = {}) {
  const serverUrl = config.serverUrl || 'ws://localhost:8080'
  const onRender = config.onRender || (() => {})
  const onInput = config.onInput || (() => ({}))
  const onConnect = config.onConnect || (() => {})
  const onDisconnect = config.onDisconnect || (() => {})
  const onWorldState = config.onWorldState || (() => {})

  let ws = null
  let playerId = null
  let currentTick = 0
  let entities = new Map()
  let players = new Map()
  let connected = false
  let inputInterval = null

  function onMessage(raw) {
    try {
      const msg = typeof raw === 'string' ? JSON.parse(raw) : JSON.parse(raw.toString())
      if (msg.type === 'player_assigned') {
        playerId = msg.playerId
        currentTick = msg.tick
        onConnect({ playerId, tick: currentTick })
      } else if (msg.type === 'world_state') {
        const decoded = SnapshotEncoder.decode(msg.data)
        for (const ent of decoded.entities) {
          entities.set(ent.id, ent)
        }
        onWorldState(Array.from(entities.values()))
      } else if (msg.type === 'snapshot') {
        const decoded = SnapshotEncoder.decode(msg.data)
        currentTick = decoded.tick
        for (const p of decoded.players) {
          players.set(p.id, p)
        }
        for (const ent of decoded.entities) {
          entities.set(ent.id, ent)
        }
        onRender(Array.from(entities.values()), Array.from(players.values()))
      } else if (msg.type === 'player_disconnected') {
        players.delete(msg.playerId)
      }
    } catch (e) {}
  }

  function sendInput(input) {
    if (!ws || !connected) return
    ws.send(JSON.stringify({ type: 'input', input }))
  }

  function startInputLoop(rate = 60) {
    if (inputInterval) return
    inputInterval = setInterval(() => {
      if (!connected) return
      const input = onInput()
      if (input) sendInput(input)
    }, 1000 / rate)
  }

  function stopInputLoop() {
    if (inputInterval) {
      clearInterval(inputInterval)
      inputInterval = null
    }
  }

  return {
    get playerId() { return playerId },
    get tick() { return currentTick },
    get entities() { return entities },
    get players() { return players },
    get connected() { return connected },

    connect() {
      return new Promise((resolve, reject) => {
        try {
          ws = new WebSocket(serverUrl)
          ws.onopen = () => {
            connected = true
            resolve()
          }
          ws.onmessage = (event) => onMessage(event.data)
          ws.onclose = () => {
            connected = false
            stopInputLoop()
            onDisconnect()
          }
          ws.onerror = (err) => reject(err)
        } catch (e) {
          reject(e)
        }
      })
    },

    connectNode(WebSocketImpl) {
      return new Promise((resolve, reject) => {
        try {
          ws = new WebSocketImpl(serverUrl)
          ws.on('open', () => {
            connected = true
            resolve()
          })
          ws.on('message', (data) => onMessage(data))
          ws.on('close', () => {
            connected = false
            stopInputLoop()
            onDisconnect()
          })
          ws.on('error', (err) => reject(err))
        } catch (e) {
          reject(e)
        }
      })
    },

    sendInput,
    startInputLoop,
    stopInputLoop,

    interact(entityId) {
      if (!ws || !connected) return
      ws.send(JSON.stringify({ type: 'interact', entityId }))
    },

    sendMessage(entityId, payload) {
      if (!ws || !connected) return
      ws.send(JSON.stringify({ type: 'message', entityId, payload }))
    },

    disconnect() {
      stopInputLoop()
      if (ws) {
        connected = false
        ws.close()
      }
    },

    getEntity(id) { return entities.get(id) || null },
    getPlayer(id) { return players.get(id) || null }
  }
}
