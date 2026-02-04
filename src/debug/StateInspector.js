import EventEmitter from 'node:events'

export class StateInspector extends EventEmitter {
  constructor(config = {}) {
    super()
    this.corrections = []
    this.maxHistory = config.maxHistory || 100
    this.divergenceHistory = []
    this.inputBufferDepths = []
    this.snapshotDelays = []
  }

  recordCorrection(playerId, predicted, actual, magnitude) {
    const entry = {
      playerId,
      predicted: this._cloneVec(predicted),
      actual: this._cloneVec(actual),
      magnitude,
      ts: Date.now()
    }
    this.corrections.push(entry)
    if (this.corrections.length > this.maxHistory) this.corrections.shift()
    this.emit('correction', entry)
  }

  recordDivergence(playerId, divergence) {
    this.divergenceHistory.push({ playerId, divergence, ts: Date.now() })
    if (this.divergenceHistory.length > this.maxHistory) {
      this.divergenceHistory.shift()
    }
    this.emit('divergence', playerId, divergence)
  }

  recordInputBufferDepth(playerId, depth) {
    this.inputBufferDepths.push({ playerId, depth, ts: Date.now() })
    if (this.inputBufferDepths.length > this.maxHistory) {
      this.inputBufferDepths.shift()
    }
  }

  recordSnapshotDelay(delay) {
    this.snapshotDelays.push({ delay, ts: Date.now() })
    if (this.snapshotDelays.length > this.maxHistory) {
      this.snapshotDelays.shift()
    }
  }

  generateDiff(stateA, stateB) {
    const diff = {}
    const allKeys = new Set([...Object.keys(stateA || {}), ...Object.keys(stateB || {})])
    for (const key of allKeys) {
      const a = stateA?.[key]
      const b = stateB?.[key]
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length || a.some((v, i) => v !== b[i])) {
          diff[key] = { from: a, to: b }
        }
      } else if (a !== b) {
        diff[key] = { from: a, to: b }
      }
    }
    return diff
  }

  getCorrectionRate() {
    const recent = this.corrections.filter(c => Date.now() - c.ts < 5000)
    return recent.length / 5
  }

  getAvgDivergence() {
    const recent = this.divergenceHistory.filter(d => Date.now() - d.ts < 5000)
    if (recent.length === 0) return 0
    return recent.reduce((sum, d) => sum + d.divergence, 0) / recent.length
  }

  getAvgSnapshotDelay() {
    const recent = this.snapshotDelays.filter(d => Date.now() - d.ts < 5000)
    if (recent.length === 0) return 0
    return recent.reduce((sum, d) => sum + d.delay, 0) / recent.length
  }

  getStats() {
    return {
      correctionRate: this.getCorrectionRate(),
      avgDivergence: this.getAvgDivergence(),
      avgSnapshotDelay: this.getAvgSnapshotDelay(),
      totalCorrections: this.corrections.length,
      recentDivergences: this.divergenceHistory.slice(-10)
    }
  }

  _cloneVec(v) {
    if (Array.isArray(v)) return [...v]
    if (v && typeof v === 'object') return { ...v }
    return v
  }

  clear() {
    this.corrections = []
    this.divergenceHistory = []
    this.inputBufferDepths = []
    this.snapshotDelays = []
  }
}
