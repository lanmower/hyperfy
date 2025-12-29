import { MetricCounter } from './MetricCounter.js'

export class MetricsManager {
  constructor() {
    this.enabled = true
    this.counters = new Map()
    this.gauges = new Map()
    this.histograms = new Map()
    this.snapshots = []
    this.maxSnapshots = 100
  }

  counter(name, value = 1) {
    if (!this.enabled) return
    if (!this.counters.has(name)) {
      this.counters.set(name, new MetricCounter(name))
    }
    this.counters.get(name).increment(value)
  }

  gauge(name, value) {
    if (!this.enabled) return
    this.gauges.set(name, {
      value,
      timestamp: performance.now(),
    })
  }

  histogram(name, value) {
    if (!this.enabled) return
    if (!this.histograms.has(name)) {
      this.histograms.set(name, new MetricCounter(name))
    }
    this.histograms.get(name).increment(value)
  }

  timing(name, fn) {
    if (!this.enabled) {
      return fn()
    }

    const start = performance.now()
    try {
      const result = fn()
      const duration = performance.now() - start
      this.histogram(name, duration)
      return result
    } catch (err) {
      const duration = performance.now() - start
      this.histogram(`${name}.error`, duration)
      throw err
    }
  }

  async timingAsync(name, fn) {
    if (!this.enabled) {
      return fn()
    }

    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.histogram(name, duration)
      return result
    } catch (err) {
      const duration = performance.now() - start
      this.histogram(`${name}.error`, duration)
      throw err
    }
  }

  getCounter(name) {
    return this.counters.get(name)?.toJSON() || null
  }

  getGauge(name) {
    return this.gauges.get(name) || null
  }

  getHistogram(name) {
    return this.histograms.get(name)?.toJSON() || null
  }

  snapshot() {
    const snap = {
      timestamp: performance.now(),
      counters: Object.fromEntries(
        Array.from(this.counters.entries()).map(([name, counter]) => [
          name,
          counter.toJSON(),
        ])
      ),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([name, histogram]) => [
          name,
          histogram.toJSON(),
        ])
      ),
    }

    this.snapshots.push(snap)
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift()
    }

    return snap
  }

  getSnapshots() {
    return [...this.snapshots]
  }

  getLatestSnapshot() {
    return this.snapshots[this.snapshots.length - 1] || null
  }

  reset() {
    this.counters.forEach(c => c.reset())
    this.gauges.clear()
    this.histograms.forEach(h => h.reset())
  }

  setEnabled(enabled) {
    this.enabled = enabled
  }

  clearSnapshots() {
    this.snapshots = []
  }

  getStats() {
    return {
      enabled: this.enabled,
      counterCount: this.counters.size,
      gaugeCount: this.gauges.size,
      histogramCount: this.histograms.size,
      snapshotCount: this.snapshots.length,
    }
  }
}

export const metrics = new MetricsManager()
