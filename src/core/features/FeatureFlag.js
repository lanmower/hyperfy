import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('FeatureFlag')

export class FeatureFlag {
  constructor(name, config = {}) {
    this.name = name
    this.enabled = config.enabled !== false
    this.description = config.description || ''
    this.owner = config.owner || 'unknown'
    this.rolloutPercentage = config.rolloutPercentage || (this.enabled ? 100 : 0)
    this.createdAt = config.createdAt || Date.now()
    this.deprecatedAt = config.deprecatedAt || null
    this.fallback = config.fallback || null
    this.metadata = config.metadata || {}
    this.dependencies = config.dependencies || []
  }

  isEnabled(context = {}) {
    if (!this.enabled) {
      return false
    }

    if (this.rolloutPercentage < 100) {
      const hash = this.hashContext(context)
      return (hash % 100) < this.rolloutPercentage
    }

    return true
  }

  isDeprecated() {
    return this.deprecatedAt !== null
  }

  getDeprecationAge() {
    if (!this.deprecatedAt) return null
    return Date.now() - this.deprecatedAt
  }

  hashContext(context) {
    const key = `${this.name}:${context.userId || 'anonymous'}:${context.sessionId || 'default'}`
    let hash = 0
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  checkDependencies(featureManager) {
    const missing = []
    for (const dep of this.dependencies) {
      const depFlag = featureManager.get(dep)
      if (!depFlag || !depFlag.isEnabled()) {
        missing.push(dep)
      }
    }
    return missing
  }

  canEnable(featureManager) {
    const deps = this.checkDependencies(featureManager)
    return deps.length === 0
  }

  getStatus() {
    return {
      name: this.name,
      enabled: this.enabled,
      rolloutPercentage: this.rolloutPercentage,
      isDeprecated: this.isDeprecated(),
      deprecationAge: this.getDeprecationAge(),
      description: this.description,
      owner: this.owner,
      dependencies: this.dependencies,
      metadata: this.metadata
    }
  }
}
