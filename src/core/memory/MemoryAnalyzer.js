import { ComponentLogger } from '../utils/logging/ComponentLogger.js'
import { MemorySnapshot } from './MemorySnapshot.js'

const logger = new ComponentLogger('MemoryAnalyzer')

export class MemoryAnalyzer {
  constructor(maxSnapshots = 20) {
    this.snapshots = []
    this.maxSnapshots = maxSnapshots
    this.leakCandidates = new Map()
    this.allocationTrends = new Map()
  }

  takeSnapshot(label) {
    const snapshot = new MemorySnapshot(label)
    this.snapshots.push(snapshot)

    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift()
    }

    return snapshot
  }

  getSnapshot(index) {
    if (index < 0 || index >= this.snapshots.length) return null
    return this.snapshots[index]
  }

  getAllSnapshots() {
    return [...this.snapshots]
  }

  compareSnapshots(index1, index2) {
    const snap1 = this.getSnapshot(index1)
    const snap2 = this.getSnapshot(index2)

    if (!snap1 || !snap2) {
      logger.warn('Invalid snapshot indices', { index1, index2 })
      return null
    }

    return this.calculateDelta(snap1, snap2)
  }

  calculateDelta(snap1, snap2) {
    const delta = {
      timeElapsed: snap2.timestamp - snap1.timestamp,
      heapDelta: null,
      objectCountDeltas: {},
      leakLikelyhood: 0,
    }

    if (snap1.heapData && snap2.heapData) {
      delta.heapDelta = {
        rssDelta: snap2.heapData.rss - snap1.heapData.rss,
        heapUsedDelta: snap2.heapData.heapUsed - snap1.heapData.heapUsed,
        heapTotalDelta: snap2.heapData.heapTotal - snap1.heapData.heapTotal,
        externalDelta: snap2.heapData.external - snap1.heapData.external,
        percentChange: ((snap2.heapData.heapUsed - snap1.heapData.heapUsed) / snap1.heapData.heapUsed) * 100,
      }
    }

    for (const type in snap1.objectCounts) {
      const count1 = snap1.objectCounts[type]
      const count2 = snap2.objectCounts[type]
      delta.objectCountDeltas[type] = {
        delta: count2 - count1,
        percentChange: count1 > 0 ? ((count2 - count1) / count1) * 100 : 0,
      }
    }

    delta.leakLikelyhood = this.assessLeakLikelyhood(delta)

    return delta
  }

  assessLeakLikelyhood(delta) {
    let score = 0

    if (delta.heapDelta) {
      const heapChangePercent = Math.abs(delta.heapDelta.percentChange)
      if (heapChangePercent > 20) score += 30
      if (heapChangePercent > 50) score += 20
      if (heapChangePercent > 100) score += 20

      if (delta.heapDelta.percentChange > 0) score += 10
    }

    for (const type in delta.objectCountDeltas) {
      const typeChange = delta.objectCountDeltas[type].percentChange
      if (typeChange > 50) score += 5
      if (typeChange > 100) score += 10
    }

    return Math.min(100, score)
  }

  detectLeaks() {
    const leaks = []

    if (this.snapshots.length < 3) {
      logger.warn('Not enough snapshots to detect leaks (need 3+)')
      return leaks
    }

    const durations = []
    for (let i = 1; i < this.snapshots.length; i++) {
      const delta = this.calculateDelta(this.snapshots[i - 1], this.snapshots[i])
      durations.push(delta)
    }

    const consistentGrowth = this.analyzeConsistentGrowth(durations)
    const steadyAccumulation = this.analyzeSteadyAccumulation(durations)

    if (consistentGrowth) leaks.push(consistentGrowth)
    if (steadyAccumulation) leaks.push(steadyAccumulation)

    return leaks
  }

  analyzeConsistentGrowth(deltas) {
    let positiveCount = 0
    let totalDelta = 0

    for (const delta of deltas) {
      if (delta.heapDelta && delta.heapDelta.percentChange > 5) {
        positiveCount++
        totalDelta += delta.heapDelta.heapUsedDelta
      }
    }

    const consistencyRatio = positiveCount / deltas.length

    if (consistencyRatio > 0.7 && totalDelta > 1024 * 1024) {
      return {
        type: 'CONSISTENT_GROWTH',
        severity: Math.min(100, (totalDelta / (1024 * 1024)) * 10),
        description: `Heap consistently growing (${(totalDelta / (1024 * 1024)).toFixed(2)}MB total)`,
        consistencyRatio,
        positiveSnapshots: positiveCount,
        totalSnapshots: deltas.length,
      }
    }

    return null
  }

  analyzeSteadyAccumulation(deltas) {
    const objectTypeAccumulation = {}

    for (const delta of deltas) {
      for (const type in delta.objectCountDeltas) {
        if (!objectTypeAccumulation[type]) {
          objectTypeAccumulation[type] = { positive: 0, total: 0, maxDelta: 0 }
        }

        const typeDelta = delta.objectCountDeltas[type]
        objectTypeAccumulation[type].total++

        if (typeDelta.delta > 0) {
          objectTypeAccumulation[type].positive++
          objectTypeAccumulation[type].maxDelta = Math.max(objectTypeAccumulation[type].maxDelta, typeDelta.delta)
        }
      }
    }

    let suspiciousTypes = []
    for (const type in objectTypeAccumulation) {
      const acc = objectTypeAccumulation[type]
      if (acc.positive / acc.total > 0.7 && acc.maxDelta > 100) {
        suspiciousTypes.push({
          type,
          ratio: acc.positive / acc.total,
          maxDelta: acc.maxDelta,
        })
      }
    }

    if (suspiciousTypes.length > 0) {
      return {
        type: 'STEADY_ACCUMULATION',
        severity: Math.min(100, suspiciousTypes.length * 15),
        description: `${suspiciousTypes.length} object type(s) accumulating steadily`,
        suspiciousTypes,
      }
    }

    return null
  }

  getGrowthRate(startIndex = 0, endIndex = -1) {
    if (endIndex === -1) endIndex = this.snapshots.length - 1
    if (startIndex >= endIndex || startIndex < 0 || endIndex >= this.snapshots.length) {
      return null
    }

    const snap1 = this.snapshots[startIndex]
    const snap2 = this.snapshots[endIndex]

    if (!snap1.heapData || !snap2.heapData) return null

    const heapGrowth = snap2.heapData.heapUsed - snap1.heapData.heapUsed
    const timeElapsed = snap2.timestamp - snap1.timestamp

    return {
      heapGrowth,
      timeElapsed,
      growthPerSecond: heapGrowth / (timeElapsed / 1000),
      growthPerMinute: (heapGrowth / (timeElapsed / 1000)) * 60,
    }
  }

  getObjectTypeGrowthTrend(type) {
    const trend = []

    for (const snapshot of this.snapshots) {
      const count = snapshot.objectCounts[type] || 0
      trend.push({
        label: snapshot.label,
        timestamp: snapshot.timestamp,
        count,
      })
    }

    return trend
  }

  getHeapTrend() {
    const trend = []

    for (const snapshot of this.snapshots) {
      if (snapshot.heapData) {
        trend.push({
          label: snapshot.label,
          timestamp: snapshot.timestamp,
          heapUsed: snapshot.heapData.heapUsed,
          heapTotal: snapshot.heapData.heapTotal,
          usagePercent: snapshot.getHeapUsagePercent(),
        })
      }
    }

    return trend
  }

  getReport() {
    const report = {
      snapshotCount: this.snapshots.length,
      timespan: null,
      leaks: this.detectLeaks(),
      growthRate: this.getGrowthRate(),
      heapTrend: this.getHeapTrend(),
      objectTypesWithGrowth: [],
    }

    if (this.snapshots.length > 1) {
      report.timespan = {
        start: this.snapshots[0].timestamp,
        end: this.snapshots[this.snapshots.length - 1].timestamp,
        duration: this.snapshots[this.snapshots.length - 1].timestamp - this.snapshots[0].timestamp,
      }
    }

    for (const type in this.snapshots[0].objectCounts) {
      const trend = this.getObjectTypeGrowthTrend(type)
      const growth = trend[trend.length - 1].count - trend[0].count
      if (growth > 0) {
        report.objectTypesWithGrowth.push({
          type,
          totalGrowth: growth,
          trend,
        })
      }
    }

    report.objectTypesWithGrowth.sort((a, b) => b.totalGrowth - a.totalGrowth)

    return report
  }

  clear() {
    this.snapshots = []
    this.leakCandidates.clear()
    this.allocationTrends.clear()
  }
}

export const memoryAnalyzer = new MemoryAnalyzer()
