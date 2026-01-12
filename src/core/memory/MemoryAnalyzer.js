import { StructuredLogger } from '../utils/logging/index.js'
import { MemorySnapshot } from './MemorySnapshot.js'
import { MemoryAnalyzerMetrics } from './MemoryAnalyzerMetrics.js'
import { MemoryAnalyzerReporter } from './MemoryAnalyzerReporter.js'

const logger = new StructuredLogger('MemoryAnalyzer')

export class MemoryAnalyzer {
  constructor(maxSnapshots = 20) {
    this.metrics = new MemoryAnalyzerMetrics()
    this.metrics.maxSnapshots = maxSnapshots
    this.reporter = new MemoryAnalyzerReporter()
    this.leakCandidates = new Map()
    this.allocationTrends = new Map()
  }

  takeSnapshot(label) {
    const snapshot = new MemorySnapshot(label)
    return this.metrics.takeSnapshot(label, snapshot)
  }

  getSnapshot(index) {
    return this.metrics.getSnapshot(index)
  }

  getAllSnapshots() {
    return this.metrics.getAllSnapshots()
  }

  compareSnapshots(index1, index2) {
    const snap1 = this.metrics.getSnapshot(index1)
    const snap2 = this.metrics.getSnapshot(index2)

    if (!snap1 || !snap2) {
      logger.warn('Invalid snapshot indices', { index1, index2 })
      return null
    }

    const delta = this.metrics.calculateDelta(snap1, snap2)
    delta.leakLikelyhood = this.metrics.assessLeakLikelyhood(delta)

    return delta
  }

  detectLeaks() {
    const snapshots = this.metrics.getAllSnapshots()
    const leaks = []

    if (snapshots.length < 3) {
      logger.warn('Not enough snapshots to detect leaks (need 3+)')
      return leaks
    }

    const durations = []
    for (let i = 1; i < snapshots.length; i++) {
      const delta = this.metrics.calculateDelta(snapshots[i - 1], snapshots[i])
      durations.push(delta)
    }

    const consistentGrowth = this.reporter.analyzeConsistentGrowth(durations)
    const steadyAccumulation = this.reporter.analyzeSteadyAccumulation(durations)

    if (consistentGrowth) leaks.push(consistentGrowth)
    if (steadyAccumulation) leaks.push(steadyAccumulation)

    return leaks
  }

  getGrowthRate(startIndex = 0, endIndex = -1) {
    return this.metrics.getGrowthRate(startIndex, endIndex)
  }

  getObjectTypeGrowthTrend(type) {
    return this.metrics.getObjectTypeGrowthTrend(type)
  }

  getHeapTrend() {
    return this.metrics.getHeapTrend()
  }

  getReport() {
    const snapshots = this.metrics.getAllSnapshots()
    const metrics = {
      growthRate: this.getGrowthRate(),
      heapTrend: this.getHeapTrend(),
      objectTypeGrowth: new Map(),
    }

    for (const type in snapshots[0]?.objectCounts || {}) {
      metrics.objectTypeGrowth.set(type, this.metrics.getObjectTypeGrowthTrend(type))
    }

    return this.reporter.generateReport(snapshots, metrics)
  }

  clear() {
    this.metrics.clear()
    this.leakCandidates.clear()
    this.allocationTrends.clear()
  }
}

export const memoryAnalyzer = new MemoryAnalyzer()
