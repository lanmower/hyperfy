import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('SystemIntegrationLifecycle')

export class SystemIntegrationVerifier {
  constructor(world) {
    this.world = world
    this.checks = new Map()
    this.results = []
    this.lastVerification = null
  }

  registerCheck(name, checkFn, options = {}) {
    this.checks.set(name, {
      fn: checkFn,
      critical: options.critical || false,
      timeout: options.timeout || 5000,
      description: options.description || ''
    })
  }

  async verify() {
    const startTime = Date.now()
    const results = []
    for (const [name, check] of this.checks) {
      const checkResult = await this.runCheck(name, check)
      results.push(checkResult)
    }
    const duration = Date.now() - startTime
    const verification = {
      timestamp: Date.now(),
      duration,
      results,
      summary: this.summarizeResults(results)
    }
    this.results.push(verification)
    this.lastVerification = verification
    logger.info('System integration verification completed', {
      duration,
      passed: verification.summary.passed,
      failed: verification.summary.failed,
      critical: verification.summary.criticalFailures
    })
    return verification
  }

  async runCheck(name, check) {
    const startTime = Date.now()
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Check timeout')), check.timeout)
      )
      await Promise.race([check.fn(this.world), timeoutPromise])
      const duration = Date.now() - startTime
      return { name, status: 'passed', duration, error: null }
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        name,
        status: 'failed',
        duration,
        error: error.message,
        critical: check.critical
      }
    }
  }

  summarizeResults(results) {
    const passed = results.filter(r => r.status === 'passed').length
    const failed = results.filter(r => r.status === 'failed').length
    const criticalFailures = results.filter(r => r.status === 'failed' && r.critical).length
    return {
      total: results.length,
      passed,
      failed,
      criticalFailures,
      passRate: ((passed / results.length) * 100).toFixed(2) + '%'
    }
  }

  getLatestResults() {
    return this.lastVerification
  }

  getAllResults() {
    return [...this.results]
  }
}

export class HealthMonitor {
  constructor(world) {
    this.world = world
    this.healthChecks = new Map()
    this.status = 'unknown'
    this.lastCheck = null
  }

  registerHealthCheck(name, checkFn, options = {}) {
    this.healthChecks.set(name, {
      fn: checkFn,
      weight: options.weight || 1,
      threshold: options.threshold || 0.8,
      description: options.description || ''
    })
  }

  async checkHealth() {
    const checks = {}
    let totalWeight = 0
    let totalScore = 0
    for (const [name, check] of this.healthChecks) {
      try {
        const score = await check.fn(this.world)
        checks[name] = {
          status: score >= check.threshold ? 'healthy' : 'degraded',
          score,
          threshold: check.threshold
        }
        totalWeight += check.weight
        totalScore += score * check.weight
      } catch (error) {
        checks[name] = {
          status: 'unhealthy',
          score: 0,
          error: error.message
        }
      }
    }
    const healthScore = totalWeight > 0 ? totalScore / totalWeight : 0
    this.status = healthScore >= 0.8 ? 'healthy' : healthScore >= 0.5 ? 'degraded' : 'unhealthy'
    this.lastCheck = {
      timestamp: Date.now(),
      score: healthScore,
      status: this.status,
      checks
    }
    return this.lastCheck
  }

  getStatus() {
    return {
      status: this.status,
      score: this.lastCheck?.score || null,
      lastCheck: this.lastCheck?.timestamp || null,
      checks: this.lastCheck?.checks || {}
    }
  }

  getDetails() {
    return this.lastCheck
  }
}
