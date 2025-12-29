import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('SystemIntegration')

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

export class DependencyResolver {
  constructor(world) {
    this.world = world
    this.dependencies = new Map()
    this.resolved = new Set()
    this.failures = []
  }

  registerDependency(name, dependencies, resolveFn) {
    this.dependencies.set(name, {
      dependencies: Array.isArray(dependencies) ? dependencies : [dependencies],
      resolveFn
    })
  }

  async resolve() {
    this.resolved.clear()
    this.failures = []

    const order = this.topologicalSort()

    for (const name of order) {
      const dep = this.dependencies.get(name)

      try {
        await dep.resolveFn(this.world)
        this.resolved.add(name)
        logger.debug('Dependency resolved', { name })
      } catch (error) {
        this.failures.push({ name, error: error.message })
        logger.error('Dependency resolution failed', { name, error: error.message })
      }
    }

    return {
      resolved: Array.from(this.resolved),
      failures: this.failures,
      success: this.failures.length === 0
    }
  }

  topologicalSort() {
    const visited = new Set()
    const visiting = new Set()
    const result = []

    const visit = (name) => {
      if (visited.has(name)) return
      if (visiting.has(name)) {
        logger.warn('Circular dependency detected', { name })
        return
      }

      visiting.add(name)

      const dep = this.dependencies.get(name)
      if (dep) {
        for (const depName of dep.dependencies) {
          if (this.dependencies.has(depName)) {
            visit(depName)
          }
        }
      }

      visiting.delete(name)
      visited.add(name)
      result.push(name)
    }

    for (const name of this.dependencies.keys()) {
      visit(name)
    }

    return result
  }

  getDependencyGraph() {
    const graph = {}
    for (const [name, dep] of this.dependencies) {
      graph[name] = dep.dependencies
    }
    return graph
  }
}
