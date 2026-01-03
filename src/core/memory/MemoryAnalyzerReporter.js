export class MemoryAnalyzerReporter {
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

  generateReport(snapshots, metrics) {
    const report = {
      snapshotCount: snapshots.length,
      timespan: null,
      leaks: [],
      growthRate: metrics.growthRate,
      heapTrend: metrics.heapTrend,
      objectTypesWithGrowth: [],
    }

    if (snapshots.length > 1) {
      report.timespan = {
        start: snapshots[0].timestamp,
        end: snapshots[snapshots.length - 1].timestamp,
        duration: snapshots[snapshots.length - 1].timestamp - snapshots[0].timestamp,
      }
    }

    for (const type in snapshots[0].objectCounts) {
      const trend = metrics.objectTypeGrowth.get(type) || []
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
}
