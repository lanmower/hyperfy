import { System } from './System.js'
import { PerformanceMetrics } from './performance/PerformanceMetrics.js'
import { PerformanceDisplay } from './performance/PerformanceDisplay.js'

export class PerformanceMonitor extends System {
  static DEPS = {
    events: 'events',
    stage: 'stage',
    physics: 'physics',
    entities: 'entities',
    network: 'network',
  }

  constructor(world) {
    super(world)
    this.metrics = new PerformanceMetrics()
    this.display = new PerformanceDisplay()
    this.frameStartTime = 0
    this.active = false
    this.baselineFile = null
    this.regressions = []
  }

  init() {
    this.setupLogging()
  }

  start() {
    this.setupBaselineCheck()
  }

  setupLogging() {
    const originalError = console.error
    const originalWarn = console.warn
    console.error = (...args) => {
      originalError(...args)
      if (args[0]?.includes?.('Script')) {
        this.metrics.recordScriptError()
      }
    }
    console.warn = (...args) => {
      originalWarn(...args)
      if (args[0]?.includes?.('Script')) {
        this.metrics.recordScriptWarning()
      }
    }
  }

  preTick() {
    this.frameStartTime = performance.now()
  }

  update(delta) {
    this.metrics.recordMemory()
  }

  postUpdate() {
    const frameTime = performance.now() - this.frameStartTime
    this.metrics.recordFrameTime(frameTime)

    if (this.active) {
      this.display.update(this.metrics.getSnapshot())
    }

    this.checkRegressions()
  }

  setupBaselineCheck() {
    if (typeof fetch !== 'undefined') {
      fetch('/performance-baseline.json')
        .then(r => r.json())
        .catch(() => null)
        .then(baseline => {
          this.baselineFile = baseline
        })
    }
  }

  checkRegressions() {
    const snapshot = this.metrics.getSnapshot()
    const baseline = this.baselineFile
    if (!baseline) return

    const checks = [
      {
        name: 'Frame Time',
        value: snapshot.frameTime.avg,
        threshold: baseline.frameTime.avg * 2,
        critical: baseline.frameTime.avg * 3,
      },
      {
        name: 'Memory Growth',
        value: parseFloat(snapshot.memory.growth),
        threshold: parseFloat(baseline.memory.peak) * 0.5,
        critical: parseFloat(baseline.memory.peak),
      },
      {
        name: 'Network Latency',
        value: parseFloat(snapshot.network.avgLatency),
        threshold: parseFloat(baseline.network.avgLatency) * 1.5,
        critical: parseFloat(baseline.network.avgLatency) * 2.5,
      },
    ]

    for (const check of checks) {
      if (check.value > check.critical) {
        this.recordRegression(check.name, check.value, check.critical, 'critical')
      } else if (check.value > check.threshold) {
        this.recordRegression(check.name, check.value, check.threshold, 'warning')
      }
    }
  }

  recordRegression(name, value, threshold, level) {
    const existing = this.regressions.find(r => r.name === name)
    if (existing && existing.value === value) return

    const regression = {
      name,
      value,
      threshold,
      level,
      timestamp: new Date().toISOString(),
    }

    this.regressions.push(regression)
    if (this.regressions.length > 100) this.regressions.shift()

    if (level === 'critical') {
      console.error(`[Performance] CRITICAL ${name}: ${value.toFixed(2)} (threshold: ${threshold.toFixed(2)})`)
    } else {
      console.warn(`[Performance] WARNING ${name}: ${value.toFixed(2)} (threshold: ${threshold.toFixed(2)})`)
    }
  }

  toggle(visible = true) {
    this.active = visible
    if (visible) {
      this.display.show()
    } else {
      this.display.hide()
    }
  }

  recordEntitySpawn(ms) {
    this.metrics.recordEntitySpawn(ms)
  }

  recordEntityDespawn(ms) {
    this.metrics.recordEntityDespawn(ms)
  }

  recordNetworkMessage(type, size = 0) {
    this.metrics.recordNetworkMessage(type, size)
  }

  recordNetworkLatency(ms) {
    this.metrics.recordNetworkLatency(ms)
  }

  recordPhysicsSimulation(ms) {
    this.metrics.recordPhysicsSimulation(ms)
  }

  recordScriptExecution(scriptName, ms) {
    this.metrics.recordScriptExecution(scriptName, ms)
  }

  recordRaycast(ms) {
    this.metrics.recordRaycast(ms)
  }

  recordRenderingUpdate(ms, stats) {
    this.metrics.recordRenderingUpdate(ms, stats)
  }

  getMetrics() {
    return this.metrics.getSnapshot()
  }

  reset() {
    this.metrics.reset()
    this.regressions = []
  }

  cleanup() {
    this.display.cleanup()
  }
}
