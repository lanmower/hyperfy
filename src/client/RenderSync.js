export class RenderSync {
  constructor(config = {}) {
    this.displayStates = new Map()
    this.interpolationFactor = 0
    this.frameTime = 0
    this.callbacks = {
      onRenderPlayer: config.onRenderPlayer || (() => {}),
      onRemovePlayer: config.onRemovePlayer || (() => {}),
      onUpdateHUD: config.onUpdateHUD || (() => {})
    }
    this.lastPlayerIds = new Set()
  }

  updateStates(displayStates) {
    const currentPlayerIds = new Set(displayStates.keys())

    for (const playerId of this.lastPlayerIds) {
      if (!currentPlayerIds.has(playerId)) {
        this.callbacks.onRemovePlayer(playerId)
      }
    }

    for (const [playerId, state] of displayStates) {
      this.displayStates.set(playerId, state)

      this.callbacks.onRenderPlayer(playerId, {
        position: state.position,
        rotation: state.rotation,
        velocity: state.velocity,
        health: state.health,
        onGround: state.onGround
      })
    }

    this.lastPlayerIds = currentPlayerIds
  }

  updateHUD(stats) {
    this.callbacks.onUpdateHUD({
      fps: stats.fps || 0,
      ping: stats.ping || 0,
      players: stats.playerCount || 0,
      tick: stats.tick || 0
    })
  }

  getState(playerId) {
    return this.displayStates.get(playerId)
  }

  getAllStates() {
    return new Map(this.displayStates)
  }

  clear() {
    this.displayStates.clear()
    this.lastPlayerIds.clear()
  }
}
