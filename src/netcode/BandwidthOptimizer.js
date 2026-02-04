export class BandwidthOptimizer {
  constructor(config = {}) {
    this.config = {
      compressionThreshold: config.compressionThreshold || 100,
      deltaThreshold: config.deltaThreshold || 0.01,
      ...config
    }
    this.lastSnapshot = null
    this.lastEncodedSize = 0
    this.totalSaved = 0
    this.compressionStats = {
      original: 0,
      compressed: 0,
      ratio: 0
    }
  }

  encodeDelta(currentSnapshot, lastSnapshot) {
    if (!lastSnapshot) {
      return { full: true, snapshot: currentSnapshot }
    }

    const delta = {
      tick: currentSnapshot.tick,
      ts: currentSnapshot.timestamp,
      p: []
    }

    const lastPlayerMap = new Map()
    for (const p of lastSnapshot.p || []) {
      lastPlayerMap.set(p.i, p)
    }

    for (const currentPlayer of currentSnapshot.p) {
      const lastPlayer = lastPlayerMap.get(currentPlayer.i)

      if (!lastPlayer) {
        delta.p.push(currentPlayer)
        continue
      }

      const compressed = this.compressPlayerDelta(currentPlayer, lastPlayer)
      delta.p.push(compressed)
    }

    this.lastSnapshot = currentSnapshot
    return { full: false, delta }
  }

  compressPlayerDelta(current, last) {
    const delta = { i: current.i }

    if (!this.vectorsEqual(current.p, last.p, this.config.deltaThreshold)) {
      delta.p = current.p
    }

    if (!this.quaternionsEqual(current.r, last.r, this.config.deltaThreshold)) {
      delta.r = current.r
    }

    if (!this.vectorsEqual(current.v, last.v, this.config.deltaThreshold)) {
      delta.v = current.v
    }

    if (current.g !== last.g) {
      delta.g = current.g
    }

    if (current.h !== last.h) {
      delta.h = current.h
    }

    if (current.s !== last.s) {
      delta.s = current.s
    }

    return delta
  }

  vectorsEqual(a, b, threshold) {
    if (!a || !b) return false
    const dx = Math.abs(a.x - b.x)
    const dy = Math.abs(a.y - b.y)
    const dz = Math.abs(a.z - b.z)
    return dx < threshold && dy < threshold && dz < threshold
  }

  quaternionsEqual(a, b, threshold) {
    if (!a || !b) return false
    const dx = Math.abs(a.x - b.x)
    const dy = Math.abs(a.y - b.y)
    const dz = Math.abs(a.z - b.z)
    const dw = Math.abs(a.w - b.w)
    return dx < threshold && dy < threshold && dz < threshold && dw < threshold
  }

  getCompressionStats() {
    return {
      lastSize: this.lastEncodedSize,
      totalSaved: this.totalSaved,
      compressionRatio: this.compressionStats.ratio
    }
  }

  estimateSize(snapshot) {
    return JSON.stringify(snapshot).length
  }
}
