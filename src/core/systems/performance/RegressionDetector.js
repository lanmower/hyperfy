export class RegressionDetector {
  constructor(baseline) {
    this.baseline = baseline
    this.history = []
    this.maxHistory = 200
    this.regressions = []
  }

  addSnapshot(snapshot) {
    if (this.history.length >= this.maxHistory) {
      this.history.shift()
    }
    this.history.push({ timestamp: new Date(), snapshot })
    this.analyzeSnapshot(snapshot)
  }

  analyzeSnapshot(snapshot) {
    const baseline = this.baseline
    const issues = []

    if (!baseline) return issues

    const checks = [
      this.checkFrameTime(snapshot, baseline),
      this.checkMemoryGrowth(snapshot, baseline),
      this.checkNetworkLatency(snapshot, baseline),
      this.checkPhysicsSimulation(snapshot, baseline),
      this.checkScriptErrors(snapshot, baseline),
    ].filter(Boolean)

    return checks
  }

  checkFrameTime(snapshot, baseline) {
    const current = snapshot.frameTime.avg
    const baselineValue = baseline.frameTime.target || 16.67
    const threshold = baselineValue * baseline.regressionDetection.frameTimeMultiplier

    if (current > threshold) {
      return {
        metric: 'FrameTime',
        value: current.toFixed(2),
        baseline: baselineValue.toFixed(2),
        threshold: threshold.toFixed(2),
        regression: ((current / baselineValue - 1) * 100).toFixed(1),
        level: current > baselineValue * 3 ? 'critical' : 'warning',
      }
    }
    return null
  }

  checkMemoryGrowth(snapshot, baseline) {
    const current = parseFloat(snapshot.memory.growth)
    const baselineValue = baseline.memory.growthRate * 60
    const threshold = baselineValue * baseline.regressionDetection.memoryGrowthMultiplier

    if (current > threshold) {
      return {
        metric: 'MemoryGrowth',
        value: current.toFixed(2),
        baseline: baselineValue.toFixed(2),
        threshold: threshold.toFixed(2),
        regression: ((current / baselineValue - 1) * 100).toFixed(1),
        level: current > baseline.memory.critical ? 'critical' : 'warning',
      }
    }
    return null
  }

  checkNetworkLatency(snapshot, baseline) {
    const current = parseFloat(snapshot.network.avgLatency)
    const baselineValue = baseline.network.latency.target || 50
    const threshold = baselineValue * baseline.regressionDetection.latencyMultiplier

    if (current > threshold) {
      return {
        metric: 'NetworkLatency',
        value: current.toFixed(2),
        baseline: baselineValue.toFixed(2),
        threshold: threshold.toFixed(2),
        regression: ((current / baselineValue - 1) * 100).toFixed(1),
        level: current > baseline.network.latency.critical ? 'critical' : 'warning',
      }
    }
    return null
  }

  checkPhysicsSimulation(snapshot, baseline) {
    const current = parseFloat(snapshot.physics.avgSimTime)
    const baselineValue = baseline.physics.simTime.target || 3
    const threshold = baselineValue * 2

    if (current > threshold) {
      return {
        metric: 'PhysicsSimulation',
        value: current.toFixed(2),
        baseline: baselineValue.toFixed(2),
        threshold: threshold.toFixed(2),
        regression: ((current / baselineValue - 1) * 100).toFixed(1),
        level: current > baselineValue * 3 ? 'critical' : 'warning',
      }
    }
    return null
  }

  checkScriptErrors(snapshot, baseline) {
    const errorCount = snapshot.scripts.errorCount
    const warningCount = snapshot.scripts.warningCount

    if (errorCount > 0 || warningCount > 5) {
      return {
        metric: 'ScriptHealth',
        errors: errorCount,
        warnings: warningCount,
        level: errorCount > 0 ? 'critical' : 'warning',
      }
    }
    return null
  }

  detectTrends() {
    if (this.history.length < 10) return null

    const recent = this.history.slice(-10).map(h => h.snapshot.frameTime.avg)
    const older = this.history.slice(-20, -10).map(h => h.snapshot.frameTime.avg)

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length

    const trend = ((recentAvg / olderAvg - 1) * 100).toFixed(1)

    return {
      metric: 'FrameTimeTrend',
      recent: recentAvg.toFixed(2),
      older: olderAvg.toFixed(2),
      trend,
      direction: trend > 0 ? 'degrading' : 'improving',
    }
  }

  getReport() {
    const trend = this.detectTrends()
    const recent = this.history.slice(-50)

    return {
      timestamp: new Date().toISOString(),
      historySize: this.history.length,
      trend,
      snapshots: recent.map(h => ({
        time: h.timestamp,
        frameTime: h.snapshot.frameTime.avg.toFixed(2),
        memory: h.snapshot.memory.current,
        latency: h.snapshot.network.avgLatency,
      })),
    }
  }
}
