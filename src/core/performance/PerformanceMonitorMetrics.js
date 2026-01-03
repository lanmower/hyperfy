export class CircularBuffer {
  constructor(size) {
    this.buffer = []
    this.size = size
    this.index = 0
  }

  push(item) {
    if (this.buffer.length < this.size) {
      this.buffer.push(item)
    } else {
      this.buffer[this.index] = item
    }
    this.index = (this.index + 1) % this.size
  }

  getAll() {
    return [...this.buffer]
  }

  getLast(count) {
    const start = Math.max(0, this.buffer.length - count)
    return this.buffer.slice(start)
  }

  clear() {
    this.buffer = []
    this.index = 0
  }
}

export class PerformanceMonitorMetrics {
  constructor() {
    this.measurements = new Map()
    this.framePhases = new CircularBuffer(60)
    this.systemPhases = new CircularBuffer(60)
    this.entityOperations = new CircularBuffer(60)
  }

  recordMeasurement(result) {
    if (!this.measurements.has(result.label)) {
      this.measurements.set(result.label, [])
    }

    const measurements = this.measurements.get(result.label)
    measurements.push({
      duration: result.duration,
      timestamp: result.timestamp,
    })

    if (measurements.length > 1000) {
      measurements.shift()
    }
  }

  recordFramePhase(phase, duration) {
    this.framePhases.push({
      phase,
      duration,
      timestamp: Date.now(),
    })
  }

  recordSystemPhase(system, phase, duration) {
    this.systemPhases.push({
      system,
      phase,
      duration,
      timestamp: Date.now(),
    })
  }

  recordEntityOperation(operation, duration, entityCount = 0) {
    this.entityOperations.push({
      operation,
      duration,
      entityCount,
      timestamp: Date.now(),
    })
  }

  getStats(label) {
    const measurements = this.measurements.get(label)
    if (!measurements || !measurements.length) {
      return null
    }

    const durations = measurements.map(m => m.duration)
    const sorted = [...durations].sort((a, b) => a - b)
    const sum = durations.reduce((a, b) => a + b, 0)

    return {
      label,
      count: durations.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / durations.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    }
  }

  getAllStats() {
    const stats = {}
    for (const label of this.measurements.keys()) {
      stats[label] = this.getStats(label)
    }
    return stats
  }

  clear() {
    this.measurements.clear()
    this.framePhases.clear()
    this.systemPhases.clear()
    this.entityOperations.clear()
  }
}
