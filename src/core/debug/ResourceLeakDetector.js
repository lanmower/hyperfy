import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('ResourceLeakDetector')

export class ResourceLeakDetector {
  constructor() {
    this.enabled = typeof process === 'undefined'
    this.tracked = new Map()
    this.snapshots = []
    this.maxSnapshots = 50
  }

  trackObject(category, object, metadata = {}) {
    if (!this.enabled) return

    const id = this.generateId()
    const entry = {
      id,
      category,
      object: new WeakRef(object),
      metadata,
      createdAt: Date.now(),
      stackTrace: this.captureStackTrace(),
    }

    if (!this.tracked.has(category)) {
      this.tracked.set(category, new Map())
    }
    this.tracked.get(category).set(id, entry)
  }

  untrackObject(category, object) {
    if (!this.enabled) return

    const categoryMap = this.tracked.get(category)
    if (!categoryMap) return

    for (const [id, entry] of categoryMap.entries()) {
      if (entry.object.deref() === object) {
        categoryMap.delete(id)
        break
      }
    }
  }

  captureStackTrace() {
    if (typeof Error.captureStackTrace !== 'function') {
      return ''
    }

    const obj = {}
    Error.captureStackTrace(obj, this.captureStackTrace)
    return obj.stack || ''
  }

  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  snapshot() {
    if (!this.enabled) return null

    const snapshot = {
      timestamp: Date.now(),
      categories: {},
    }

    for (const [category, entries] of this.tracked.entries()) {
      const alive = []
      const leaked = []

      for (const [id, entry] of entries.entries()) {
        if (entry.object.deref() === undefined) {
          leaked.push(id)
        } else {
          alive.push({
            id,
            metadata: entry.metadata,
            age: Date.now() - entry.createdAt,
          })
        }
      }

      if (alive.length || leaked.length) {
        snapshot.categories[category] = {
          alive: alive.length,
          aliveLists: alive,
          leaked: leaked.length,
        }
      }
    }

    this.snapshots.push(snapshot)
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift()
    }

    return snapshot
  }

  getLeakReport(threshold = 10) {
    if (!this.enabled) return null

    const report = {
      timestamp: Date.now(),
      leaks: [],
      warnings: [],
    }

    for (const [category, entries] of this.tracked.entries()) {
      let leakCount = 0
      const leakedEntries = []

      for (const [id, entry] of entries.entries()) {
        if (entry.object.deref() === undefined) {
          leakCount++
          leakedEntries.push(entry)
        }
      }

      if (leakCount >= threshold) {
        report.leaks.push({
          category,
          count: leakCount,
          samples: leakedEntries.slice(0, 3).map(e => ({
            metadata: e.metadata,
            age: Date.now() - e.createdAt,
            stack: e.stackTrace.split('\n').slice(0, 5).join('\n'),
          })),
        })
      } else if (leakCount > 0) {
        report.warnings.push({
          category,
          count: leakCount,
          message: `${leakCount} potential leaks in ${category}`,
        })
      }
    }

    if (report.leaks.length) {
      logger.warn('Resource leaks detected', { leaks: report.leaks.length })
    }

    return report
  }

  clear() {
    this.tracked.clear()
    this.snapshots = []
  }

  getStats() {
    if (!this.enabled) return null

    const stats = {
      totalTracked: 0,
      byCategory: {},
    }

    for (const [category, entries] of this.tracked.entries()) {
      stats.byCategory[category] = entries.size
      stats.totalTracked += entries.size
    }

    return stats
  }
}

export const resourceLeakDetector = new ResourceLeakDetector()
