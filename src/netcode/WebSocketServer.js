import { WebSocketServer as WSServer } from 'ws'
import { TickSystem } from './TickSystem.js'
import { PlayerManager } from './PlayerManager.js'
import { NetworkState } from './NetworkState.js'
import { SnapshotEncoder } from './SnapshotEncoder.js'

export class WebSocketServer {
  constructor(config = {}) {
    this.config = {
      port: config.port || 8080,
      tickRate: config.tickRate || 128,
      ...config
    }
    this.wss = null
    this.tickSystem = null
    this.playerManager = null
    this.networkState = null
    this.physicsWorld = null
  }

  async init(physicsWorld) {
    this.physicsWorld = physicsWorld
    this.tickSystem = new TickSystem(this.config.tickRate)
    this.playerManager = new PlayerManager()
    this.networkState = new NetworkState()
    this.wss = new WSServer({ port: this.config.port })
    this.wss.on('connection', (socket) => {
      this.onClientConnect(socket)
    })
    this.tickSystem.onTick((tick, deltaTime) => {
      this.onTick(tick, deltaTime)
    })
    this.tickSystem.start()
    return this
  }

  onClientConnect(socket) {
    const playerId = this.playerManager.addPlayer(socket)
    this.networkState.addPlayer(playerId)
    socket.send(JSON.stringify({
      type: 'player_assigned',
      playerId,
      tick: this.tickSystem.currentTick
    }))
    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message)
        this.onClientMessage(playerId, data)
      } catch (e) {
      }
    })
    socket.on('close', () => {
      this.onClientDisconnect(playerId)
    })
    socket.on('error', () => {
    })
  }

  onClientMessage(playerId, data) {
    if (data.type === 'input') {
      this.playerManager.addInput(playerId, data.input)
      const player = this.playerManager.getPlayer(playerId)
      if (player) {
        this.networkState.updatePlayer(playerId, {
          inputSequence: player.inputSequence
        })
      }
    }
  }

  onClientDisconnect(playerId) {
    this.playerManager.removePlayer(playerId)
    this.networkState.removePlayer(playerId)
    this.playerManager.broadcast({
      type: 'player_disconnected',
      playerId,
      tick: this.tickSystem.currentTick
    })
  }

  onTick(tick, deltaTime) {
    this.networkState.setTick(tick, Date.now())
    for (const player of this.playerManager.getConnectedPlayers()) {
      const inputs = this.playerManager.getInputs(player.id)
      if (inputs.length > 0) {
        const lastInput = inputs[inputs.length - 1]
        const state = player.state
        if (lastInput.data) {
          if (lastInput.data.forward) {
            state.position[2] += 0.1 * deltaTime
          }
          if (lastInput.data.backward) {
            state.position[2] -= 0.1 * deltaTime
          }
          if (lastInput.data.left) {
            state.position[0] -= 0.1 * deltaTime
          }
          if (lastInput.data.right) {
            state.position[0] += 0.1 * deltaTime
          }
        }
      }
      state.velocity[1] -= 9.81 * deltaTime
      state.position[1] += state.velocity[1] * deltaTime
      if (state.position[1] < 0) {
        state.position[1] = 0
        state.velocity[1] = 0
        state.onGround = true
      }
    }
    const snapshot = this.networkState.getSnapshot()
    const encoded = SnapshotEncoder.encode(snapshot)
    this.playerManager.broadcast({
      type: 'snapshot',
      data: encoded
    })
  }

  stop() {
    this.tickSystem.stop()
    if (this.wss) {
      this.wss.close()
    }
  }

  getPlayerCount() {
    return this.playerManager.getPlayerCount()
  }

  getTickRate() {
    return this.config.tickRate
  }
}
