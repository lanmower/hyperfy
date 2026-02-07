import { PredictionEngine } from './PredictionEngine.js'
import { pack, unpack } from '../protocol/msgpack.js'
import { MSG } from '../protocol/MessageTypes.js'

export class PhysicsNetworkClient {
  constructor(config = {}) {
    this.config = {
      url: config.url || config.serverUrl || 'ws://localhost:8080/ws',
      tickRate: config.tickRate || 128,
      predictionEnabled: config.predictionEnabled !== false,
      debug: config.debug || false,
      ...config
    }
    this.ws = null
    this.transportType = 'websocket'
    this.playerId = null
    this.connected = false
    this.predictionEngine = null
    this.remoteStates = new Map()
    this.entityStates = new Map()
    this.lastSnapshotTick = 0
    this.currentTick = 0
    this.state = { players: [], entities: [] }
    this.heartbeatTimer = null
    this.callbacks = {
      onConnect: config.onConnect || (() => {}),
      onDisconnect: config.onDisconnect || (() => {}),
      onPlayerJoined: config.onPlayerJoined || (() => {}),
      onPlayerLeft: config.onPlayerLeft || (() => {}),
      onEntityAdded: config.onEntityAdded || (() => {}),
      onEntityRemoved: config.onEntityRemoved || (() => {}),
      onSnapshot: config.onSnapshot || (() => {}),
      onRender: config.onRender || (() => {}),
      onStateUpdate: config.onStateUpdate || (() => {})
    }
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url)
        this.ws.binaryType = 'arraybuffer'

        this.ws.onopen = () => {
          this.connected = true
          this._startHeartbeat()
          if (this.config.debug) {
            console.log('[PhysicsNetworkClient] Connected to server')
          }
          this.callbacks.onConnect()
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.onMessage(event.data)
        }

        this.ws.onclose = () => {
          this.connected = false
          this._stopHeartbeat()
          if (this.config.debug) {
            console.log('[PhysicsNetworkClient] Disconnected from server')
          }
          this.callbacks.onDisconnect()
        }

        this.ws.onerror = (error) => {
          if (this.config.debug) {
            console.error('[PhysicsNetworkClient] WebSocket error:', error)
          }
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  sendInput(input) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    if (this.config.predictionEnabled && this.predictionEngine) {
      this.predictionEngine.addInput(input)
    }

    const msg = { type: MSG.INPUT, payload: { input } }
    this.ws.send(pack(msg))
  }

  sendFire(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    const msg = { type: MSG.APP_EVENT, payload: { type: 'fire', shooterId: this.playerId, ...data } }
    this.ws.send(pack(msg))
  }

  onMessage(data) {
    try {
      const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data
      const message = unpack(bytes)
      const type = message.type
      const payload = message.payload || {}

      if (this.config.debug) {
        console.log('[PhysicsNetworkClient] Received message type:', type, payload)
      }

      if (type === MSG.HANDSHAKE_ACK) {
        this.playerId = payload.playerId
        this.currentTick = payload.tick
        this.predictionEngine = new PredictionEngine(this.config.tickRate)
        this.predictionEngine.init(this.playerId)
        console.log('[PhysicsNetworkClient] Assigned player ID:', this.playerId)
      } else if (type === MSG.SNAPSHOT) {
        this.onSnapshot(payload)
      } else if (type === MSG.PLAYER_LEAVE) {
        this.remoteStates.delete(payload.playerId)
        this.callbacks.onPlayerLeft(payload.playerId)
      } else if (type === MSG.STATE_CORRECTION) {
        this.onSnapshot(payload)
      }
    } catch (e) {
      console.error('[PhysicsNetworkClient] Failed to parse message:', e)
    }
  }

  onSnapshot(data) {
    this.lastSnapshotTick = data.tick || 0
    this.currentTick = data.tick || 0

    const players = data.players || []
    for (const p of players) {
      let playerId, state
      if (Array.isArray(p)) {
        playerId = p[0]
        state = {
          id: playerId,
          position: [p[1], p[2], p[3]],
          rotation: [p[4], p[5], p[6], p[7]],
          velocity: [p[8], p[9], p[10]],
          onGround: p[11] === 1,
          health: p[12],
          inputSequence: p[13]
        }
      } else {
        playerId = p.id || p.i
        state = {
          id: playerId,
          position: p.position || [p.p?.x || 0, p.p?.y || 0, p.p?.z || 0],
          rotation: p.rotation || [p.r?.x || 0, p.r?.y || 0, p.r?.z || 0, p.r?.w || 1],
          velocity: p.velocity || [p.v?.x || 0, p.v?.y || 0, p.v?.z || 0],
          onGround: p.onGround ?? (p.g === 1),
          health: p.health ?? p.h ?? 100
        }
      }

      if (!this.remoteStates.has(playerId)) {
        this.callbacks.onPlayerJoined(playerId, state)
      }

      this.remoteStates.set(playerId, state)

      if (playerId === this.playerId && this.config.predictionEnabled && this.predictionEngine) {
        this.predictionEngine.onServerSnapshot({ players: [state] }, data.tick)
      }
    }

    const entities = data.entities || []
    for (const e of entities) {
      let entityId, entityState
      if (Array.isArray(e)) {
        entityId = e[0]
        entityState = {
          id: entityId,
          model: e[1],
          position: [e[2], e[3], e[4]],
          rotation: [e[5], e[6], e[7], e[8]],
          bodyType: e[9],
          custom: e[10]
        }
      } else {
        entityId = e.id
        entityState = {
          id: entityId,
          model: e.model,
          position: e.position || [0, 0, 0],
          rotation: e.rotation || [0, 0, 0, 1],
          bodyType: e.bodyType || 'static',
          custom: e.custom || null
        }
      }

      if (!this.entityStates.has(entityId)) {
        this.callbacks.onEntityAdded(entityId, entityState)
      }

      this.entityStates.set(entityId, entityState)
    }

    this.state.players = Array.from(this.remoteStates.values())
    this.state.entities = Array.from(this.entityStates.values())
    this.callbacks.onSnapshot(data)
    this.callbacks.onStateUpdate(this.state)
    this.render()
  }

  render() {
    const displayStates = new Map()

    for (const [playerId, serverState] of this.remoteStates) {
      if (playerId === this.playerId && this.config.predictionEnabled) {
        displayStates.set(playerId, this.predictionEngine.getDisplayState(this.currentTick, 0))
      } else {
        displayStates.set(playerId, serverState)
      }
    }

    this.callbacks.onRender(displayStates)
  }

  getLocalState() {
    if (this.config.predictionEnabled && this.predictionEngine) {
      return this.predictionEngine.localState
    }
    return this.remoteStates.get(this.playerId)
  }

  getRemoteState(playerId) {
    return this.remoteStates.get(playerId)
  }

  getAllStates() {
    return new Map(this.remoteStates)
  }

  getEntity(entityId) {
    return this.entityStates.get(entityId)
  }

  getAllEntities() {
    return new Map(this.entityStates)
  }

  disconnect() {
    this._stopHeartbeat()
    if (this.ws) {
      this.ws.close()
    }
  }

  _startHeartbeat() {
    this._stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const msg = { type: MSG.HEARTBEAT, payload: {} }
        this.ws.send(pack(msg))
      }
    }, 1000)
  }

  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }
}
