export class LagCompensator {
  constructor(config = {}) {
    this.maxHistorySize = config.maxHistorySize || 128
    this.hitboxLeadFactor = config.hitboxLeadFactor || 1.0
    this.playerHistory = new Map()
    this.rewindWindow = config.rewindWindow || 200
  }

  recordPlayerState(playerId, state, tick, timestamp) {
    if (!this.playerHistory.has(playerId)) {
      this.playerHistory.set(playerId, [])
    }

    const history = this.playerHistory.get(playerId)
    history.push({
      tick,
      timestamp,
      position: JSON.parse(JSON.stringify(state.position)),
      rotation: JSON.parse(JSON.stringify(state.rotation)),
      velocity: JSON.parse(JSON.stringify(state.velocity)),
      onGround: state.onGround
    })

    if (history.length > this.maxHistorySize) {
      history.shift()
    }
  }

  getPlayerStateAtTime(playerId, timestamp) {
    const history = this.playerHistory.get(playerId)
    if (!history || history.length === 0) return null

    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].timestamp <= timestamp) {
        return history[i]
      }
    }

    return history[0]
  }

  predictTargetPosition(playerId, currentTime, networkLatency) {
    const currentState = this.getPlayerStateAtTime(playerId, currentTime)
    if (!currentState) return null

    const predictionTime = networkLatency / 1000
    const leadDistance = this.hitboxLeadFactor * predictionTime

    const predicted = {
      position: [
        currentState.position[0] + currentState.velocity[0] * leadDistance,
        currentState.position[1] + currentState.velocity[1] * leadDistance,
        currentState.position[2] + currentState.velocity[2] * leadDistance
      ],
      rotation: currentState.rotation,
      velocity: currentState.velocity,
      onGround: currentState.onGround
    }

    return predicted
  }

  validateHit(shooter, target, hitTime, networkLatency) {
    const targetStateAtHit = this.getPlayerStateAtTime(target, hitTime)
    if (!targetStateAtHit) {
      return { valid: false, reason: 'No state history' }
    }

    const shotLatency = networkLatency / 1000
    const timeSinceShot = (Date.now() - hitTime) / 1000

    if (timeSinceShot > this.rewindWindow / 1000) {
      return { valid: false, reason: 'Hit outside rewind window' }
    }

    return {
      valid: true,
      targetState: targetStateAtHit,
      rewindTime: shotLatency
    }
  }

  detectTeleport(playerId, newState, maxDistance = 1.0) {
    const lastState = this.getLastState(playerId)
    if (!lastState) return false

    const dx = newState.position[0] - lastState.position[0]
    const dy = newState.position[1] - lastState.position[1]
    const dz = newState.position[2] - lastState.position[2]

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    return distance > maxDistance
  }

  detectSpeedCheat(playerId, newState, maxSpeed = 20) {
    const velocity = newState.velocity
    const speed = Math.sqrt(
      velocity[0] * velocity[0] +
      velocity[1] * velocity[1] +
      velocity[2] * velocity[2]
    )

    return speed > maxSpeed
  }

  getLastState(playerId) {
    const history = this.playerHistory.get(playerId)
    if (!history || history.length === 0) return null
    return history[history.length - 1]
  }

  clearPlayerHistory(playerId) {
    this.playerHistory.delete(playerId)
  }

  clearAllHistory() {
    this.playerHistory.clear()
  }
}
