import { FeatureFlag } from './FeatureFlag.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('FeatureManager')

export class FeatureManager {
  constructor() {
    this.flags = new Map()
    this.context = {}
    this.history = []
    this.maxHistory = 1000
  }

  register(name, config = {}) {
    if (this.flags.has(name)) {
      logger.warn('Feature flag already registered', { name })
      return this.flags.get(name)
    }

    const flag = new FeatureFlag(name, config)
    this.flags.set(name, flag)

    logger.info('Feature flag registered', {
      name,
      enabled: flag.enabled,
      rolloutPercentage: flag.rolloutPercentage
    })

    return flag
  }

  unregister(name) {
    if (this.flags.delete(name)) {
      logger.info('Feature flag unregistered', { name })
      return true
    }
    return false
  }

  get(name) {
    return this.flags.get(name)
  }

  isEnabled(name, context = {}) {
    const flag = this.flags.get(name)
    if (!flag) {
      logger.warn('Feature flag not found', { name })
      return false
    }

    const contextWithDefaults = { ...this.context, ...context }
    const enabled = flag.isEnabled(contextWithDefaults)

    this.recordHistory(name, enabled)

    return enabled
  }

  isEnabledSilent(name, context = {}) {
    const flag = this.flags.get(name)
    if (!flag) {
      return false
    }

    const contextWithDefaults = { ...this.context, ...context }
    return flag.isEnabled(contextWithDefaults)
  }

  enable(name) {
    const flag = this.flags.get(name)
    if (!flag) {
      throw new Error(`Feature flag '${name}' not found`)
    }

    const previous = flag.enabled
    flag.enabled = true

    if (!previous) {
      logger.info('Feature flag enabled', { name })
    }

    return flag
  }

  disable(name) {
    const flag = this.flags.get(name)
    if (!flag) {
      throw new Error(`Feature flag '${name}' not found`)
    }

    const previous = flag.enabled
    flag.enabled = false

    if (previous) {
      logger.info('Feature flag disabled', { name })
    }

    return flag
  }

  setRollout(name, percentage) {
    const flag = this.flags.get(name)
    if (!flag) {
      throw new Error(`Feature flag '${name}' not found`)
    }

    if (percentage < 0 || percentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100')
    }

    flag.rolloutPercentage = percentage
    logger.info('Feature flag rollout updated', { name, percentage })

    return flag
  }

  setContext(context) {
    this.context = { ...this.context, ...context }
    logger.debug('Feature context updated', { keys: Object.keys(context) })
  }

  getAll() {
    return Array.from(this.flags.values()).map(f => f.getStatus())
  }

  getEnabled() {
    return Array.from(this.flags.values())
      .filter(f => f.enabled)
      .map(f => f.name)
  }

  getDeprecated() {
    return Array.from(this.flags.values())
      .filter(f => f.isDeprecated())
      .map(f => f.getStatus())
  }

  recordHistory(name, enabled) {
    this.history.push({
      name,
      enabled,
      timestamp: Date.now()
    })

    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }
  }

  getHistory(name = null, limit = 100) {
    let entries = this.history.slice(-limit)

    if (name) {
      entries = entries.filter(e => e.name === name)
    }

    return entries
  }

  clearHistory() {
    this.history = []
    logger.info('Feature flag history cleared')
  }

  getStats() {
    const flags = Array.from(this.flags.values())

    return {
      totalFlags: flags.length,
      enabledCount: flags.filter(f => f.enabled).length,
      disabledCount: flags.filter(f => !f.enabled).length,
      deprecatedCount: flags.filter(f => f.isDeprecated()).length,
      rolloutStats: {
        fullyRolledOut: flags.filter(f => f.rolloutPercentage === 100).length,
        partiallyRolledOut: flags.filter(f => f.rolloutPercentage > 0 && f.rolloutPercentage < 100).length,
        notRolledOut: flags.filter(f => f.rolloutPercentage === 0).length
      },
      historySize: this.history.length
    }
  }

  validate() {
    const issues = []

    for (const [name, flag] of this.flags.entries()) {
      const missingDeps = flag.checkDependencies(this)
      if (missingDeps.length > 0) {
        issues.push({
          flag: name,
          type: 'missing_dependency',
          dependencies: missingDeps
        })
      }

      if (flag.isDeprecated()) {
        const age = flag.getDeprecationAge()
        if (age > 90 * 24 * 60 * 60 * 1000) {
          issues.push({
            flag: name,
            type: 'old_deprecation',
            age
          })
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues
    }
  }
}

export const featureManager = new FeatureManager()
