import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('CleanupTracker')

export class CleanupTracker {
  constructor() {
    this.cleanups = new Map()
    this.cleanupStats = {
      total: 0,
      successful: 0,
      failed: 0,
      pending: 0
    }
    this._pendingCount = 0
  }

  _calculatePendingCount() {
    return Array.from(this.cleanups.values()).reduce((sum, arr) => sum + arr.filter(c => !c.executed).length, 0)
  }

  registerCleanup(name, cleanupFn, priority = 0) {
    if (!this.cleanups.has(name)) {
      this.cleanups.set(name, [])
    }

    this.cleanups.get(name).push({
      fn: cleanupFn,
      priority,
      executed: false,
      error: null,
      executedAt: null,
      duration: null
    })

    this.cleanupStats.pending = this._calculatePendingCount()

    return () => {
      this.deregisterCleanup(name, cleanupFn)
    }
  }

  deregisterCleanup(name, cleanupFn) {
    const items = this.cleanups.get(name)
    if (!items) return

    const index = items.findIndex(c => c.fn === cleanupFn)
    if (index >= 0) {
      items.splice(index, 1)
    }

    this.cleanupStats.pending = this._calculatePendingCount()
  }

  async executeCleanups(filter = null) {
    const results = {
      executed: [],
      failed: [],
      skipped: []
    }

    for (const [name, items] of this.cleanups.entries()) {
      if (filter && !filter.includes(name)) {
        results.skipped.push({ name, count: items.length })
        continue
      }

      const sorted = items.slice().sort((a, b) => b.priority - a.priority)

      for (const item of sorted) {
        if (item.executed) continue

        const startTime = Date.now()
        try {
          await Promise.resolve(item.fn())
          item.executed = true
          item.executedAt = startTime
          item.duration = Date.now() - startTime
          this.cleanupStats.successful++
          results.executed.push({ name, duration: item.duration })
        } catch (err) {
          item.error = err.message
          item.executed = true
          item.executedAt = startTime
          item.duration = Date.now() - startTime
          this.cleanupStats.failed++
          results.failed.push({ name, error: err.message, duration: item.duration })
          logger.error('Cleanup failed', { name, error: err.message })
        }
      }
    }

    this.cleanupStats.total = this.cleanupStats.successful + this.cleanupStats.failed
    this.cleanupStats.pending = this._calculatePendingCount()

    return results
  }

  getStats() {
    const byName = {}
    for (const [name, items] of this.cleanups.entries()) {
      byName[name] = {
        total: items.length,
        executed: items.filter(c => c.executed).length,
        failed: items.filter(c => c.error).length
      }
    }

    return {
      ...this.cleanupStats,
      byName,
      averageDuration: this.getAverageDuration()
    }
  }

  getAverageDuration() {
    const executed = Array.from(this.cleanups.values())
      .flat()
      .filter(c => c.executed && c.duration)

    if (!executed.length) return 0
    const total = executed.reduce((sum, c) => sum + c.duration, 0)
    return Math.round(total / executed.length)
  }

  reset() {
    this.cleanups.clear()
    this.cleanupStats = {
      total: 0,
      successful: 0,
      failed: 0,
      pending: 0
    }
  }

  getDetailedReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.cleanupStats,
      cleanups: []
    }

    for (const [name, items] of this.cleanups.entries()) {
      for (const item of items) {
        report.cleanups.push({
          name,
          priority: item.priority,
          executed: item.executed,
          error: item.error,
          duration: item.duration,
          executedAt: item.executedAt ? new Date(item.executedAt).toISOString() : null
        })
      }
    }

    return report
  }
}

export const cleanupTracker = new CleanupTracker()
