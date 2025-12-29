import { ComponentLogger } from '../utils/logging/ComponentLogger.js'
import { PerformanceBudget } from './PerformanceBudget.js'

const logger = new ComponentLogger('PerformanceMonitor')

export class PerformanceMonitor {
  constructor() {
    this.marks = new Map()
    this.measurements = new Map()
    this.violations = []
    this.samples = {
      framePhases: new CircularBuffer(60),
      systemPhases: new CircularBuffer(60),
      entityOperations: new CircularBuffer(60),
    }
    this.enabled = true
    this.sampleRate = 30,
    this.frameCount = 0
  }

  start(label) {
    if (!this.enabled) return

    const key = `__perf_${label}_${Date.now()}`
    const mark = {
      label,
      startTime: performance.now(),
      key,
    }

    this.marks.set(key, mark)
    return key
  }

  end(key, category = null, path = null) {
    if (!this.enabled) return null

    const mark = this.marks.get(key)
    if (!mark) {
      logger.warn('Performance mark not found', { key })
      return null
    }

    const duration = performance.now() - mark.startTime
    this.marks.delete(key)

    const result = {
      label: mark.label,
      duration,
      category,
      path,
      timestamp: Date.now(),
    }

    this.recordMeasurement(result)
    this.checkBudget(result)

    return duration
  }

  measure(label, fn, category = null, path = null) {
    if (!this.enabled) {
      return fn()
    }

    const key = this.start(label)
    try {
      const result = fn()
      this.end(key, category, path)
      return result
    } catch (error) {
      this.end(key, category, path)
      throw error
    }
  }

  async measureAsync(label, fn, category = null, path = null) {
    if (!this.enabled) {
      return fn()
    }

    const key = this.start(label)
    try {
      const result = await fn()
      this.end(key, category, path)
      return result
    } catch (error) {
      this.end(key, category, path)
      throw error
    }
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

  checkBudget(result) {
    if (!result.category || !result.path) return

    if (PerformanceBudget.isBudgetExceeded(result.category, result.path, result.duration)) {
      const excess = PerformanceBudget.getExcessAmount(result.category, result.path, result.duration)
      const percent = PerformanceBudget.getExcessPercentage(result.category, result.path, result.duration)
      const budget = PerformanceBudget.getBudget(result.category, result.path)

      const violation = {
        label: result.label,
        category: result.category,
        path: result.path,
        budget,
        actual: result.duration,
        excess,
        percent: percent.toFixed(1),
        timestamp: result.timestamp,
      }

      this.violations.push(violation)

      if (this.violations.length > 100) {
        this.violations.shift()
      }

      if (this.violations.length % 10 === 0) {
        logger.warn('Performance budget exceeded', {
          label: result.label,
          budget: `${budget}ms`,
          actual: `${result.duration.toFixed(2)}ms`,
          excess: `+${excess.toFixed(2)}ms (${percent.toFixed(1)}%)`,
        })
      }
    }
  }

  recordFramePhase(phase, duration) {
    if (this.frameCount % this.sampleRate === 0) {
      this.samples.framePhases.push({
        phase,
        duration,
        timestamp: Date.now(),
      })
    }
    this.frameCount++
  }

  recordSystemPhase(system, phase, duration) {
    if (this.frameCount % this.sampleRate === 0) {
      this.samples.systemPhases.push({
        system,
        phase,
        duration,
        timestamp: Date.now(),
      })
    }
  }

  recordEntityOperation(operation, duration, entityCount = 0) {
    if (this.frameCount % this.sampleRate === 0) {
      this.samples.entityOperations.push({
        operation,
        duration,
        entityCount,
        timestamp: Date.now(),
      })
    }
  }

  getStats(label) {
    const measurements = this.measurements.get(label)
    if (!measurements || measurements.length === 0) {
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

  getViolations(limit = 20) {
    return this.violations.slice(-limit)
  }

  getViolationSummary() {
    const summary = {}
    for (const violation of this.violations) {
      const key = `${violation.category}:${violation.path}`
      if (!summary[key]) {
        summary[key] = {
          category: violation.category,
          path: violation.path,
          budget: violation.budget,
          count: 0,
          maxExcess: 0,
          totalExcess: 0,
        }
      }
      summary[key].count++
      summary[key].maxExcess = Math.max(summary[key].maxExcess, violation.excess)
      summary[key].totalExcess += violation.excess
    }

    return Object.values(summary).sort((a, b) => b.totalExcess - a.totalExcess)
  }

  clear() {
    this.marks.clear()
    this.measurements.clear()
    this.violations = []
    this.frameCount = 0
  }

  enable() {
    this.enabled = true
  }

  disable() {
    this.enabled = false
  }

  setSampleRate(rate) {
    this.sampleRate = Math.max(1, rate)
  }
}

class CircularBuffer {
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

export const performanceMonitor = new PerformanceMonitor()
