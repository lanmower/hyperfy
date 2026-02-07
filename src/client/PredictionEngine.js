import { ReconciliationEngine } from './ReconciliationEngine.js'

export class PredictionEngine {
  constructor(tickRate = 128) {
    this.tickRate = tickRate
    this.tickDuration = 1000 / tickRate
    this.localPlayerId = null
    this.localState = null
    this.lastServerState = null
    this.inputHistory = []
    this.reconciliationEngine = new ReconciliationEngine()
    this.movement = {
      maxSpeed: 8.0, groundAccel: 10.0, airAccel: 1.0,
      friction: 6.0, stopSpeed: 2.0, jumpImpulse: 4.5
    }
    this.gravityY = -9.81
  }

  setMovement(m) {
    if (m.maxSpeed != null) this.movement.maxSpeed = m.maxSpeed
    if (m.groundAccel != null) this.movement.groundAccel = m.groundAccel
    if (m.airAccel != null) this.movement.airAccel = m.airAccel
    if (m.friction != null) this.movement.friction = m.friction
    if (m.stopSpeed != null) this.movement.stopSpeed = m.stopSpeed
    if (m.jumpImpulse != null) this.movement.jumpImpulse = m.jumpImpulse
  }

  setGravity(g) { if (g && g[1] != null) this.gravityY = g[1] }

  init(playerId, initialState = {}) {
    this.localPlayerId = playerId
    this.localState = {
      id: playerId,
      position: initialState.position || [0, 0, 0],
      rotation: initialState.rotation || [0, 0, 0, 1],
      velocity: initialState.velocity || [0, 0, 0],
      onGround: true,
      health: initialState.health || 100
    }
    this.lastServerState = JSON.parse(JSON.stringify(this.localState))
  }

  addInput(input) {
    this.inputHistory.push({
      sequence: this.inputHistory.length,
      data: input,
      timestamp: Date.now()
    })
    if (this.inputHistory.length > 128) {
      this.inputHistory.shift()
    }
    this.predict(input)
  }

  predict(input) {
    const dt = this.tickDuration / 1000
    const state = this.localState
    const { maxSpeed, groundAccel, airAccel, friction, stopSpeed, jumpImpulse } = this.movement
    let vx = state.velocity[0], vz = state.velocity[2]
    let wishX = 0, wishZ = 0, wishSpeed = 0, jumped = false

    if (input) {
      let fx = 0, fz = 0
      if (input.forward) fz += 1
      if (input.backward) fz -= 1
      if (input.left) fx -= 1
      if (input.right) fx += 1
      const flen = Math.sqrt(fx * fx + fz * fz)
      if (flen > 0) { fx /= flen; fz /= flen }
      const yaw = input.yaw || 0
      const cy = Math.cos(yaw), sy = Math.sin(yaw)
      wishX = fz * sy - fx * cy
      wishZ = fx * sy + fz * cy
      wishSpeed = flen > 0 ? maxSpeed : 0
      if (input.jump && state.onGround) {
        state.velocity[1] = jumpImpulse
        state.onGround = false
        jumped = true
      }
    }

    if (state.onGround && !jumped) {
      const speed = Math.sqrt(vx * vx + vz * vz)
      if (speed > 0.1) {
        const control = speed < stopSpeed ? stopSpeed : speed
        const drop = control * friction * dt
        let newSpeed = speed - drop
        if (newSpeed < 0) newSpeed = 0
        const scale = newSpeed / speed
        vx *= scale; vz *= scale
      } else { vx = 0; vz = 0 }
      if (wishSpeed > 0) {
        const cur = vx * wishX + vz * wishZ
        let add = wishSpeed - cur
        if (add > 0) {
          let as = groundAccel * wishSpeed * dt
          if (as > add) as = add
          vx += as * wishX; vz += as * wishZ
        }
      }
    } else {
      if (wishSpeed > 0) {
        const cur = vx * wishX + vz * wishZ
        let add = wishSpeed - cur
        if (add > 0) {
          let as = airAccel * wishSpeed * dt
          if (as > add) as = add
          vx += as * wishX; vz += as * wishZ
        }
      }
    }

    state.velocity[0] = vx; state.velocity[2] = vz
    state.velocity[1] += this.gravityY * dt
    state.position[0] += state.velocity[0] * dt
    state.position[1] += state.velocity[1] * dt
    state.position[2] += state.velocity[2] * dt

    if (state.position[1] < 0) {
      state.position[1] = 0
      state.velocity[1] = 0
      state.onGround = true
    }
  }

  interpolate(factor) {
    if (!this.lastServerState || !this.localState) return this.localState
    return {
      id: this.localState.id,
      position: [
        this.lastServerState.position[0] + (this.localState.position[0] - this.lastServerState.position[0]) * factor,
        this.lastServerState.position[1] + (this.localState.position[1] - this.lastServerState.position[1]) * factor,
        this.lastServerState.position[2] + (this.localState.position[2] - this.lastServerState.position[2]) * factor
      ],
      rotation: this.localState.rotation,
      velocity: this.localState.velocity,
      health: this.localState.health,
      onGround: this.localState.onGround
    }
  }

  extrapolate(ticksAhead = 1) {
    const extrapolated = JSON.parse(JSON.stringify(this.localState))
    const dt = (this.tickDuration / 1000) * ticksAhead
    extrapolated.position[0] += this.localState.velocity[0] * dt
    extrapolated.position[1] += this.localState.velocity[1] * dt
    extrapolated.position[2] += this.localState.velocity[2] * dt
    return extrapolated
  }

  onServerSnapshot(snapshot, tick) {
    for (const serverPlayer of snapshot.players) {
      if (serverPlayer.id === this.localPlayerId) {
        this.lastServerState = JSON.parse(JSON.stringify(serverPlayer))
        const reconciliation = this.reconciliationEngine.reconcile(
          this.lastServerState, this.localState, tick
        )
        if (reconciliation.needsCorrection) {
          this.reconciliationEngine.applyCorrection(this.localState, reconciliation.correction)
          this.resimulate()
        }
      }
    }
  }

  resimulate() {
    const baseState = JSON.parse(JSON.stringify(this.lastServerState))
    this.localState = baseState
    for (const input of this.inputHistory) {
      this.predict(input.data)
    }
  }

  getDisplayState(tick, ticksSinceLastSnapshot) {
    const alpha = (ticksSinceLastSnapshot % 1) / 1
    return this.interpolate(alpha)
  }

  getInputHistory() { return this.inputHistory }

  calculateDivergence() {
    if (!this.lastServerState || !this.localState) return 0
    const dx = this.localState.position[0] - this.lastServerState.position[0]
    const dy = this.localState.position[1] - this.lastServerState.position[1]
    const dz = this.localState.position[2] - this.lastServerState.position[2]
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
}
