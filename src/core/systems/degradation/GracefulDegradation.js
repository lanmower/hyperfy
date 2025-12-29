import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('GracefulDegradation')

export class GracefulDegradation {
  constructor() {
    this.features = new Map()
    this.degradationStatus = new Map()
    this.fallbacks = new Map()
    this.listeners = []
  }

  registerFeature(name, options = {}) {
    const feature = {
      name,
      optional: options.optional || false,
      required: options.required || false,
      status: 'unknown',
      error: null,
      fallback: options.fallback || null,
      errorCode: options.errorCode || null,
      dependencies: options.dependencies || [],
      priority: options.priority || 'normal',
      metadata: options.metadata || {},
    }

    this.features.set(name, feature)
    this.degradationStatus.set(name, 'unknown')
    return feature
  }

  registerFallback(featureName, fallbackFn) {
    this.fallbacks.set(featureName, fallbackFn)
    return this
  }

  async enableFeature(name, testFn) {
    const feature = this.features.get(name)
    if (!feature) {
      logger.warn('Feature not registered', { name })
      return false
    }

    try {
      if (testFn) {
        const result = await Promise.resolve(testFn())
        if (!result) {
          throw new Error('Feature test failed')
        }
      }

      feature.status = 'enabled'
      this.degradationStatus.set(name, 'enabled')
      logger.info('Feature enabled', { name })
      this.notifyListeners('feature:enabled', { name, feature })
      return true
    } catch (error) {
      feature.status = 'failed'
      feature.error = error.message
      this.degradationStatus.set(name, 'degraded')

      if (feature.optional) {
        logger.warn('Optional feature unavailable, using fallback', { name, error: error.message })
        await this.activateFallback(name)
        return false
      } else if (feature.required) {
        logger.error('Required feature failed', { name, error: error.message })
        this.degradationStatus.set(name, 'critical')
        throw error
      } else {
        logger.warn('Feature degraded', { name, error: error.message })
        await this.activateFallback(name)
        return false
      }
    }
  }

  async activateFallback(featureName) {
    const feature = this.features.get(featureName)
    if (!feature) return false

    const fallbackFn = this.fallbacks.get(featureName)
    if (!fallbackFn) {
      logger.warn('No fallback registered', { feature: featureName })
      return false
    }

    try {
      const result = await Promise.resolve(fallbackFn())
      feature.status = 'degraded'
      this.degradationStatus.set(featureName, 'degraded')
      logger.info('Fallback activated', { feature: featureName })
      this.notifyListeners('fallback:activated', { feature: featureName, result })
      return true
    } catch (error) {
      logger.error('Fallback activation failed', { feature: featureName, error: error.message })
      return false
    }
  }

  getFeatureStatus(name) {
    const feature = this.features.get(name)
    return {
      name,
      status: feature?.status || 'unknown',
      optional: feature?.optional || false,
      required: feature?.required || false,
      error: feature?.error || null,
      hasFallback: this.fallbacks.has(name),
    }
  }

  getAllStatus() {
    const status = {}
    for (const [name, feature] of this.features) {
      status[name] = {
        status: feature.status,
        optional: feature.optional,
        required: feature.required,
        error: feature.error,
        hasFallback: this.fallbacks.has(name),
        priority: feature.priority,
      }
    }
    return status
  }

  getDegradationStatus() {
    const summary = {
      overall: 'healthy',
      enabled: 0,
      degraded: 0,
      failed: 0,
      critical: 0,
      features: {},
    }

    for (const [name, status] of this.degradationStatus) {
      summary.features[name] = status

      switch (status) {
        case 'enabled':
          summary.enabled++
          break
        case 'degraded':
          summary.degraded++
          break
        case 'critical':
          summary.critical++
          break
        default:
          summary.failed++
      }
    }

    if (summary.critical > 0) {
      summary.overall = 'critical'
    } else if (summary.degraded > 0) {
      summary.overall = 'degraded'
    }

    return summary
  }

  isFeatureAvailable(name) {
    const status = this.degradationStatus.get(name)
    return status === 'enabled'
  }

  isFeatureDegraded(name) {
    const status = this.degradationStatus.get(name)
    return status === 'degraded'
  }

  canContinue(name) {
    const feature = this.features.get(name)
    if (!feature) return true

    if (feature.required && this.degradationStatus.get(name) !== 'enabled') {
      return false
    }

    return true
  }

  getDependencies(name) {
    const feature = this.features.get(name)
    return feature?.dependencies || []
  }

  async validateDependencies(name) {
    const deps = this.getDependencies(name)
    const results = {}

    for (const depName of deps) {
      const depStatus = this.degradationStatus.get(depName)
      results[depName] = depStatus === 'enabled'

      if (!results[depName]) {
        logger.warn('Dependency not available', { feature: name, dependency: depName })
      }
    }

    return results
  }

  onDegradation(callback) {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  notifyListeners(event, data) {
    for (const listener of this.listeners) {
      try {
        listener(event, data)
      } catch (error) {
        logger.error('Listener error', { event, error: error.message })
      }
    }
  }

  getReport() {
    const report = {
      timestamp: new Date().toISOString(),
      status: this.getDegradationStatus(),
      features: this.getAllStatus(),
      criticalIssues: [],
      recommendations: [],
    }

    for (const [name, feature] of this.features) {
      if (feature.status === 'failed' && feature.required) {
        report.criticalIssues.push({
          feature: name,
          error: feature.error,
          action: 'Required feature failed - system may not function properly',
        })
      }

      if (feature.status === 'degraded') {
        report.recommendations.push({
          feature: name,
          status: 'degraded',
          suggestion: 'Fallback activated - consider investigating root cause',
        })
      }
    }

    return report
  }

  reset() {
    this.features.clear()
    this.degradationStatus.clear()
    this.fallbacks.clear()
    this.listeners = []
  }
}

export const gracefulDegradation = new GracefulDegradation()
