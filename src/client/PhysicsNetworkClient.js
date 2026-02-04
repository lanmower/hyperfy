import { PredictionEngine } from './PredictionEngine.js'

export class PhysicsNetworkClient {
  constructor(config = {}) {
    this.config = {
      url: config.url || 'ws://localhost:8080',
      tickRate: config.tickRate || 128,
      predictionEnabled: config.predictionEnabled !== false,
      debug: config.debug || false,
      ...config
    }
    this.ws = null
    this.playerId = null
    this.predictionEngine = null
    this.remoteStates = new Map()
    this.lastSnapshotTick = 0
    this.currentTick = 0
    this.callbacks = {
      onConnect: config.onConnect || (() => {}),
      onDisconnect: config.onDisconnect || (() => {}),
      onPlayerJoined: config.onPlayerJoined || (() => {}),
      onPlayerLeft: config.onPlayerLeft || (() => {}),
      onSnapshot: config.onSnapshot || (() => {}),
      onRender: config.onRender || (() => {})
    }
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url)
        this.ws.binaryType = 'arraybuffer'

        this.ws.onopen = () => {
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

    if (this.config.predictionEnabled) {
      this.predictionEngine.addInput(input)
    }

    this.ws.send(JSON.stringify({
      type: 'input',
      input
    }))
  }

  onMessage(data) {
    try {
      const message = typeof data === 'string' ? JSON.parse(data) : data
      
      if (message.type === 'player_assigned') {
        this.playerId = message.playerId
        this.predictionEngine = new PredictionEngine(this.config.tickRate)
        this.predictionEngine.init(this.playerId)
        
        if (this.config.debug) {
          console.log('[PhysicsNetworkClient] Assigned player ID:', this.playerId)
        }
      } else if (message.type === 'snapshot') {
        this.onSnapshot(message.data)
      } else if (message.type === 'player_disconnected') {
        this.remoteStates.delete(message.playerId)
        this.callbacks.onPlayerLeft(message.playerId)
      }
    } catch (e) {
      if (this.config.debug) {
        console.error('[PhysicsNetworkClient] Failed to parse message:', e)
      }
    }
  }

  onSnapshot(data) {
    this.lastSnapshotTick = data.tick
    this.currentTick = data.tick

    for (const player of data.p) {
      const playerId = player.i
      const state = {
        id: playerId,
        position: [player.p.x, player.p.y, player.p.z],
        rotation: [player.r.x, player.r.y, player.r.z, player.r.w],
        velocity: [player.v.x, player.v.y, player.v.z],
        onGround: player.g === 1,
        health: player.h
      }

      if (!this.remoteStates.has(playerId)) {
        this.callbacks.onPlayerJoined(playerId, state)
      }

      this.remoteStates.set(playerId, state)

      if (playerId === this.playerId && this.config.predictionEnabled) {
        this.predictionEngine.onServerSnapshot({ tick: data.tick, players: [state] })
      }
    }

    this.callbacks.onSnapshot(data)
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

  disconnect() {
    if (this.ws) {
      this.ws.close()
    }
  }
}
