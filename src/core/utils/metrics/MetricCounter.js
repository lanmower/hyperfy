export class MetricCounter {
  constructor(name) {
    this.name = name
    this.count = 0
    this.totalValue = 0
    this.min = Infinity
    this.max = -Infinity
    this.values = []
    this.maxSamples = 1000
  }

  increment(value = 1) {
    this.count++
    this.totalValue += value
    this.values.push(value)
    if (this.values.length > this.maxSamples) {
      this.values.shift()
    }
    if (value < this.min) this.min = value
    if (value > this.max) this.max = value
  }

  getAverage() {
    return this.count === 0 ? 0 : this.totalValue / this.count
  }

  getMedian() {
    if (!this.values.length) return 0
    const sorted = [...this.values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid]
  }

  getPercentile(p) {
    if (!this.values.length) return 0
    const sorted = [...this.values].sort((a, b) => a - b)
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  reset() {
    this.count = 0
    this.totalValue = 0
    this.min = Infinity
    this.max = -Infinity
    this.values = []
  }

  toJSON() {
    return {
      name: this.name,
      count: this.count,
      total: this.totalValue,
      average: this.getAverage(),
      min: this.min === Infinity ? 0 : this.min,
      max: this.max === -Infinity ? 0 : this.max,
      median: this.getMedian(),
      p95: this.getPercentile(95),
      p99: this.getPercentile(99),
    }
  }
}
