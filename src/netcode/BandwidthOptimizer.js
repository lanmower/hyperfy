export class BandwidthOptimizer {
  constructor(config = {}) {
    this.deltaThreshold = config.deltaThreshold || 0.01
    this.lastSnapshot = null
  }

  encodeDelta(current, last) {
    if (!last) {
      this.lastSnapshot = current
      return { full: true, snapshot: current }
    }

    const lastPlayerMap = new Map()
    for (const p of last.players || []) lastPlayerMap.set(p.id, p)

    const players = []
    for (const cp of current.players || []) {
      const lp = lastPlayerMap.get(cp.id)
      if (!lp) { players.push(cp); continue }
      const delta = { id: cp.id }
      let changed = false
      if (!this._arrEqual(cp.position, lp.position, this.deltaThreshold)) {
        delta.position = cp.position; changed = true
      }
      if (!this._arrEqual(cp.rotation, lp.rotation, this.deltaThreshold)) {
        delta.rotation = cp.rotation; changed = true
      }
      if (!this._arrEqual(cp.velocity, lp.velocity, this.deltaThreshold)) {
        delta.velocity = cp.velocity; changed = true
      }
      if (cp.onGround !== lp.onGround) { delta.onGround = cp.onGround; changed = true }
      if (cp.health !== lp.health) { delta.health = cp.health; changed = true }
      if (cp.inputSequence !== lp.inputSequence) { delta.inputSequence = cp.inputSequence; changed = true }
      if (changed) players.push(delta)
    }

    this.lastSnapshot = current
    return {
      full: false,
      delta: { tick: current.tick, timestamp: current.timestamp, players }
    }
  }

  _arrEqual(a, b, threshold) {
    if (!a || !b || a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (Math.abs(a[i] - b[i]) >= threshold) return false
    }
    return true
  }
}
