import { StructuredLogger } from '../utils/logging/index.js'
import { PerformanceMonitorMetrics } from './PerformanceMonitorMetrics.js'
import { PerformanceMonitorBudgets } from './PerformanceMonitorBudgets.js'

const logger = new StructuredLogger('PerformanceMonitor')

export class PerformanceMonitor {
  constructor() {
    this.marks = new Map()
    this.metrics = new PerformanceMonitorMetrics()
    this.budgets = new PerformanceMonitorBudgets()
    this.enabled = true
    this.sampleRate = 30
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

    this.metrics.recordMeasurement(result)
    this.budgets.checkBudget(result, logger)

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

  recordFramePhase(phase, duration) {
    if (this.frameCount % this.sampleRate === 0) {
      this.metrics.recordFramePhase(phase, duration)
    }
    this.frameCount++
  }

  recordSystemPhase(system, phase, duration) {
    if (this.frameCount % this.sampleRate === 0) {
      this.metrics.recordSystemPhase(system, phase, duration)
    }
  }

  recordEntityOperation(operation, duration, entityCount = 0) {
    if (this.frameCount % this.sampleRate === 0) {
      this.metrics.recordEntityOperation(operation, duration, entityCount)
    }
  }

  getStats(label) {
    return this.metrics.getStats(label)
  }

  getAllStats() {
    return this.metrics.getAllStats()
  }

  getViolations(limit = 20) {
    return this.budgets.getViolations(limit)
  }

  getViolationSummary() {
    return this.budgets.getViolationSummary()
  }

  clear() {
    this.marks.clear()
    this.metrics.clear()
    this.budgets.clear()
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

export const performanceMonitor = new PerformanceMonitor()
