// Server health and status monitoring

import { Metrics } from '../../core/cli/Metrics.js'

export class HealthMonitor {
  constructor(world) {
    this.world = world
    this.metrics = new Metrics('Health')
    this.startTime = Date.now()
    this.checks = new Map()
    this.lastUpdate = Date.now()
  }

  registerCheck(name, fn) {
    if (typeof fn !== 'function') {
      throw new Error(`Health check ${name} must be a function`)
    }
    this.checks.set(name, fn)
    return this
  }

  async runChecks() {
    const results = {}
    for (const [name, fn] of this.checks) {
      try {
        const timer = this.metrics.timer(`check.${name}`)
        const passed = await fn()
        timer()
        results[name] = { passed, timestamp: Date.now() }
        this.metrics.counter(`check.${name}.${passed ? 'pass' : 'fail'}`)
      } catch (err) {
        results[name] = { passed: false, error: err.message, timestamp: Date.now() }
        this.metrics.counter(`check.${name}.error`)
      }
    }
    this.lastUpdate = Date.now()
    return results
  }

  getHealth() {
    const uptime = Date.now() - this.startTime
    const memory = process.memoryUsage()
    const sockets = this.world.network?.sockets?.size || 0

    return {
      status: 'ok',
      uptime,
      timestamp: new Date().toISOString(),
      memory: {
        rss: Math.round(memory.rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + 'MB',
      },
      network: {
        connectedSockets: sockets,
        maxConnections: this.world.network?.maxConnections || 'unlimited'
      },
      world: {
        entities: this.world.entities?.list?.length || 0,
        blueprints: this.world.blueprints?.list?.length || 0,
        apps: this.world.apps?.list?.length || 0,
      }
    }
  }

  getMetrics() {
    return this.metrics.getStats()
  }

  toString() {
    return `HealthMonitor(${this.checks.size} checks)`
  }
}
