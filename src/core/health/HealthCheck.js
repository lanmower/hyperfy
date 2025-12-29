import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('HealthCheck')

export class HealthCheck {
  constructor(name) {
    this.name = name
    this.status = 'unknown'
    this.lastCheck = null
    this.lastError = null
    this.checks = []
    this.metrics = {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      avgDuration: 0,
    }
  }

  addCheck(name, fn, critical = false) {
    this.checks.push({
      name,
      fn,
      critical,
      status: 'unknown',
      lastRun: null,
      duration: 0,
      error: null,
    })
    return this
  }

  async execute() {
    const startTime = performance.now()
    const results = {
      name: this.name,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      duration: 0,
      checks: [],
      errors: [],
    }

    let allPassed = true
    let criticalFailed = false

    for (const check of this.checks) {
      const checkStart = performance.now()

      try {
        const checkResult = await Promise.resolve(check.fn())

        check.status = 'passed'
        check.lastRun = new Date().toISOString()
        check.duration = performance.now() - checkStart
        check.error = null

        results.checks.push({
          name: check.name,
          status: 'passed',
          duration: check.duration,
        })

        this.metrics.passedChecks++
      } catch (error) {
        check.status = 'failed'
        check.lastRun = new Date().toISOString()
        check.duration = performance.now() - checkStart
        check.error = error.message

        results.checks.push({
          name: check.name,
          status: 'failed',
          duration: check.duration,
          error: error.message,
        })

        results.errors.push({
          check: check.name,
          error: error.message,
        })

        this.metrics.failedChecks++
        allPassed = false

        if (check.critical) {
          criticalFailed = true
        }
      }

      this.metrics.totalChecks++
    }

    results.duration = performance.now() - startTime
    this.metrics.avgDuration =
      (this.metrics.avgDuration * (this.metrics.totalChecks - 1) + results.duration) /
      this.metrics.totalChecks

    if (criticalFailed) {
      this.status = 'critical'
      results.status = 'critical'
    } else if (!allPassed) {
      this.status = 'degraded'
      results.status = 'degraded'
    } else {
      this.status = 'healthy'
      results.status = 'healthy'
    }

    this.lastCheck = results
    return results
  }

  getStatus() {
    return this.status
  }

  getLastCheck() {
    return this.lastCheck
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalChecks > 0 ? (this.metrics.passedChecks / this.metrics.totalChecks) * 100 : 0,
    }
  }

  reset() {
    this.status = 'unknown'
    this.lastCheck = null
    this.lastError = null
    this.metrics = {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      avgDuration: 0,
    }
    this.checks.forEach(c => {
      c.status = 'unknown'
      c.lastRun = null
      c.duration = 0
      c.error = null
    })
  }
}

export class HealthCheckManager {
  constructor() {
    this.checks = new Map()
    this.aggregateStatus = 'unknown'
    this.lastUpdate = null
  }

  register(subsystem, healthCheck) {
    if (!(healthCheck instanceof HealthCheck)) {
      throw new Error('Expected HealthCheck instance')
    }
    this.checks.set(subsystem, healthCheck)
    return this
  }

  unregister(subsystem) {
    return this.checks.delete(subsystem)
  }

  getCheck(subsystem) {
    return this.checks.get(subsystem)
  }

  async executeAll() {
    const results = {
      timestamp: new Date().toISOString(),
      overall: 'unknown',
      subsystems: {},
      summary: {
        healthy: 0,
        degraded: 0,
        critical: 0,
        unknown: 0,
      },
    }

    for (const [subsystem, check] of this.checks) {
      const result = await check.execute()
      results.subsystems[subsystem] = result

      switch (result.status) {
        case 'healthy':
          results.summary.healthy++
          break
        case 'degraded':
          results.summary.degraded++
          break
        case 'critical':
          results.summary.critical++
          break
        default:
          results.summary.unknown++
      }
    }

    if (results.summary.critical > 0) {
      this.aggregateStatus = 'critical'
      results.overall = 'critical'
    } else if (results.summary.degraded > 0) {
      this.aggregateStatus = 'degraded'
      results.overall = 'degraded'
    } else if (results.summary.healthy > 0) {
      this.aggregateStatus = 'healthy'
      results.overall = 'healthy'
    }

    this.lastUpdate = results
    return results
  }

  getAggregateStatus() {
    return this.aggregateStatus
  }

  getLastUpdate() {
    return this.lastUpdate
  }

  getSubsystemStatus(subsystem) {
    const check = this.checks.get(subsystem)
    return check ? check.getLastCheck() : null
  }

  getAllStatus() {
    const status = {}
    for (const [subsystem, check] of this.checks) {
      status[subsystem] = {
        status: check.getStatus(),
        metrics: check.getMetrics(),
        lastCheck: check.getLastCheck(),
      }
    }
    return status
  }
}
