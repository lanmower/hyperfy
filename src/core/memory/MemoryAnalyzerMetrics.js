export class MemoryAnalyzerMetrics {
  constructor() {
    this.snapshots = []
    this.maxSnapshots = 20
  }

  takeSnapshot(label, snapshot) {
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

  clear() {
    this.snapshots = []
  }
}
