
export class Metrics {
  constructor(name = 'Metrics') {
    this.name = name
    this.counters = new Map()
    this.timers = new Map()
    this.gauges = new Map()
    this.samples = new Map()
  }

  counter(name, increment = 1) {
    const current = this.counters.get(name) || 0
    this.counters.set(name, current + increment)
    return this.counters.get(name)
  }

  timer(name) {
    const start = performance.now()
    return () => {
      const elapsed = performance.now() - start
      this.timers.set(name, (this.timers.get(name) || 0) + elapsed)
      return elapsed
    }
  }

  gauge(name, value) {
    this.gauges.set(name, value)
    return value
  }

  sample(name, value) {
    if (!this.samples.has(name)) {
      this.samples.set(name, [])
    }
    this.samples.get(name).push(value)
  }

  getStats(name = null) {
    if (name) {
      return {
        counter: this.counters.get(name) || 0,
        timer: this.timers.get(name) || 0,
        gauge: this.gauges.get(name),
      }
    }

    const stats = {
      counters: Object.fromEntries(this.counters),
      timers: Object.fromEntries(this.timers),
      gauges: Object.fromEntries(this.gauges),
      samples: {}
    }

    for (const [name, values] of this.samples.entries()) {
      const sorted = [...values].sort((a, b) => a - b)
      stats.samples[name] = {
        count: values.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        median: sorted[Math.floor(sorted.length / 2)],
      }
    }

    return stats
  }

  reset() {
    this.counters.clear()
    this.timers.clear()
    this.gauges.clear()
    this.samples.clear()
  }

  toString() {
    return `${this.name}(${this.counters.size} counters, ${this.timers.size} timers, ${this.gauges.size} gauges)`
  }
}

export const globalMetrics = new Metrics('Global')
