export class ReconciliationEngine {
  constructor(config = {}) {
    this.correctionThreshold = config.correctionThreshold || 0.01
    this.correctionSpeed = config.correctionSpeed || 0.5
    this.stateHistory = []
    this.maxHistorySize = 128
    this.lastReconcileTime = 0
    this.reconcileInterval = config.reconcileInterval || 100
  }

  recordPredictedState(tick, state) {
    this.stateHistory.push({
      tick,
      state: JSON.parse(JSON.stringify(state)),
      timestamp: Date.now(),
      confirmed: false
    })

    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift()
    }
  }

  reconcile(serverState, localState, tick) {
    const now = Date.now()
    if (now - this.lastReconcileTime < this.reconcileInterval) {
      return { needsCorrection: false, correction: null }
    }

    this.lastReconcileTime = now

    const divergence = this.calculateDivergence(serverState, localState)

    if (divergence < this.correctionThreshold) {
      return { needsCorrection: false, divergence }
    }

    const correction = this.generateCorrection(serverState, localState)
    return { needsCorrection: true, correction, divergence }
  }

  calculateDivergence(serverState, localState) {
    if (!serverState || !localState) return 0

    const dx = serverState.position[0] - localState.position[0]
    const dy = serverState.position[1] - localState.position[1]
    const dz = serverState.position[2] - localState.position[2]

    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  generateCorrection(serverState, localState) {
    const correction = {
      position: [
        serverState.position[0] * this.correctionSpeed + localState.position[0] * (1 - this.correctionSpeed),
        serverState.position[1] * this.correctionSpeed + localState.position[1] * (1 - this.correctionSpeed),
        serverState.position[2] * this.correctionSpeed + localState.position[2] * (1 - this.correctionSpeed)
      ],
      velocity: JSON.parse(JSON.stringify(serverState.velocity)),
      onGround: serverState.onGround
    }

    return correction
  }

  applyCorrection(localState, correction) {
    localState.position = correction.position
    localState.velocity = correction.velocity
    localState.onGround = correction.onGround
  }

  resimulate(predictionEngine, fromTick) {
    const inputHistory = predictionEngine.getInputHistory()

    for (const input of inputHistory) {
      predictionEngine.predict(input.data)
    }
  }

  detectRollback(serverTick, lastConfirmedTick) {
    return serverTick <= lastConfirmedTick
  }

  getStateAtTick(tick) {
    for (let i = this.stateHistory.length - 1; i >= 0; i--) {
      if (this.stateHistory[i].tick <= tick) {
        return this.stateHistory[i]
      }
    }
    return null
  }

  confirmState(tick) {
    for (const state of this.stateHistory) {
      if (state.tick === tick) {
        state.confirmed = true
      }
    }
  }

  clearHistory() {
    this.stateHistory = []
  }
}
