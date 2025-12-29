import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('MetricsCollector')

export class MetricsCollector {
  constructor(world, dashboard) {
    this.world = world
    this.dashboard = dashboard
    this.collectors = new Map()
    this.collectionInterval = 5000
    this.isRunning = false
    this.timerId = null
  }

  registerCollector(name, fn) {
    this.collectors.set(name, fn)
    return this
  }

  start() {
    if (this.isRunning) return

    this.isRunning = true
    this.timerId = setInterval(() => this.collect(), this.collectionInterval)

    logger.info('Metrics collection started', { interval: this.collectionInterval })
    return this
  }

  stop() {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }

    logger.info('Metrics collection stopped')
    return this
  }

  async collect() {
    for (const [name, collectorFn] of this.collectors) {
      try {
        const result = await Promise.resolve(collectorFn())
        if (result !== null && result !== undefined) {
          this.dashboard.recordMetric(name, result)
        }
      } catch (error) {
        logger.warn('Collector error', { collector: name, error: error.message })
      }
    }
  }

  setupDefaultCollectors() {
    this.registerCollector('entities.count', () => this.world.entities?.items?.size || 0)
    this.registerCollector('entities.hot', () => this.world.hot?.size || 0)
    this.registerCollector('fps', () => {
      if (!this.world.graphics?.lastFps) return 60
      return Math.round(this.world.graphics.lastFps)
    })

    this.registerCollector('memory.heap', () => {
      if (typeof process === 'undefined' || !process.memoryUsage) return 0
      return Math.round(process.memoryUsage().heapUsed / (1024 * 1024))
    })

    this.registerCollector('memory.external', () => {
      if (typeof process === 'undefined' || !process.memoryUsage) return 0
      return Math.round((process.memoryUsage().external || 0) / (1024 * 1024))
    })

    this.registerCollector('network.connected', () => this.world.network?.connected ? 1 : 0)
    this.registerCollector('network.latency', () => this.world.network?.latency || 0)

    this.registerCollector('blueprints.loaded', () => this.world.blueprints?.items?.size || 0)
    this.registerCollector('loader.cache.size', () => this.world.loader?.cache?.size || 0)
    this.registerCollector('loader.pending', () => this.world.loader?.pendingLoads?.size || 0)

    this.registerCollector('performance.violations', () => {
      const violations = this.world.performanceMonitor?.getViolations(100) || []
      return violations.length
    })

    this.registerCollector('performance.avgFrameTime', () => {
      const stats = this.world.performanceMonitor?.getStats('frame')
      return Math.round((stats?.mean || 0) * 100) / 100
    })

    this.registerCollector('health.status', () => {
      const status = this.world.healthCheckManager?.getAggregateStatus?.()
      const statusMap = { healthy: 0, degraded: 1, critical: 2, unknown: 3 }
      return statusMap[status] || 3
    })

    return this
  }

  setupThresholds() {
    this.dashboard.setThreshold('fps', 30, 'warning')
    this.dashboard.setThreshold('memory.heap', 500, 'warning')
    this.dashboard.setThreshold('memory.heap', 800, 'critical')
    this.dashboard.setThreshold('entities.count', 8000, 'warning')
    this.dashboard.setThreshold('entities.count', 10000, 'critical')
    this.dashboard.setThreshold('performance.violations', 50, 'warning')
    this.dashboard.setThreshold('performance.violations', 100, 'critical')
    this.dashboard.setThreshold('network.latency', 200, 'warning')
    this.dashboard.setThreshold('network.latency', 500, 'critical')

    return this
  }

  getMetricsByCategory() {
    const metrics = this.dashboard.getAllMetrics()
    const categories = {
      entities: {},
      performance: {},
      memory: {},
      network: {},
      assets: {},
      health: {},
      other: {},
    }

    for (const [name, metric] of Object.entries(metrics)) {
      if (name.startsWith('entities.')) {
        categories.entities[name] = metric
      } else if (name.startsWith('performance.')) {
        categories.performance[name] = metric
      } else if (name.startsWith('memory.')) {
        categories.memory[name] = metric
      } else if (name.startsWith('network.')) {
        categories.network[name] = metric
      } else if (name.startsWith('loader.') || name.startsWith('blueprints.')) {
        categories.assets[name] = metric
      } else if (name.startsWith('health.')) {
        categories.health[name] = metric
      } else {
        categories.other[name] = metric
      }
    }

    return categories
  }

  getHealthReport() {
    const metrics = this.dashboard.getAllMetrics()
    const report = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {},
      recommendations: [],
    }

    const fps = metrics['fps']?.value
    if (fps && fps < 30) {
      report.checks.fps = { status: 'critical', value: fps, threshold: 30 }
      report.recommendations.push('FPS below 30 - check GPU performance')
    } else if (fps && fps < 45) {
      report.checks.fps = { status: 'warning', value: fps, threshold: 45 }
    } else {
      report.checks.fps = { status: 'healthy', value: fps }
    }

    const heapMemory = metrics['memory.heap']?.value
    if (heapMemory && heapMemory > 800) {
      report.checks.memory = { status: 'critical', value: heapMemory, threshold: 800 }
      report.recommendations.push('Heap memory critically high - investigate leaks')
    } else if (heapMemory && heapMemory > 500) {
      report.checks.memory = { status: 'warning', value: heapMemory, threshold: 500 }
    } else {
      report.checks.memory = { status: 'healthy', value: heapMemory }
    }

    const entityCount = metrics['entities.count']?.value
    if (entityCount && entityCount > 10000) {
      report.checks.entities = { status: 'critical', value: entityCount, threshold: 10000 }
      report.recommendations.push('Entity count critical - reduce scene complexity')
    } else if (entityCount && entityCount > 8000) {
      report.checks.entities = { status: 'warning', value: entityCount, threshold: 8000 }
    } else {
      report.checks.entities = { status: 'healthy', value: entityCount }
    }

    const networkLatency = metrics['network.latency']?.value
    if (networkLatency && networkLatency > 500) {
      report.checks.network = { status: 'critical', value: networkLatency, threshold: 500 }
      report.recommendations.push('Network latency critical - check connection')
    } else if (networkLatency && networkLatency > 200) {
      report.checks.network = { status: 'warning', value: networkLatency, threshold: 200 }
    } else {
      report.checks.network = { status: 'healthy', value: networkLatency }
    }

    const worstStatus = Object.values(report.checks)
      .map(c => c.status)
      .sort((a, b) => ({ critical: 0, warning: 1, healthy: 2 }[a] - { critical: 0, warning: 1, healthy: 2 }[b]))
      .at(0)

    report.status = worstStatus || 'healthy'
    return report
  }

  reset() {
    this.stop()
    this.collectors.clear()
  }
}
