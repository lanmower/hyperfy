import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('RateLimiter')

export class RateLimiter {
  constructor(world) {
    this.world = world
    this.limiters = new Map()
    this.adaptive = false
  }

  createLimiter(name, options = {}) {
    const limiter = {
      name,
      maxRequests: options.maxRequests || 100,
      windowMs: options.windowMs || 1000,
      currentRequests: 0,
      windowStart: Date.now(),
      adaptive: options.adaptive !== false,
      adaptiveThreshold: options.adaptiveThreshold || 0.7,
      adaptiveIncrease: options.adaptiveIncrease || 0.05,
      adaptiveDecrease: options.adaptiveDecrease || 0.1,
      violations: 0,
      lastViolation: 0,
      retryAfter: null,
      metadata: options.metadata || {}
    }

    this.limiters.set(name, limiter)
    logger.info('Rate limiter created', { name, ...limiter })
    return limiter
  }

  canProcess(limiterName) {
    const limiter = this.limiters.get(limiterName)
    if (!limiter) return true

    const now = Date.now()
    if (now - limiter.windowStart >= limiter.windowMs) {
      limiter.currentRequests = 0
      limiter.windowStart = now
    }

    if (limiter.currentRequests < limiter.maxRequests) {
      limiter.currentRequests++
      return true
    }

    limiter.violations++
    limiter.lastViolation = now
    limiter.retryAfter = Math.ceil((limiter.windowStart + limiter.windowMs - now) / 1000)

    return false
  }

  adaptThresholds() {
    if (!this.adaptive) return

    for (const limiter of this.limiters.values()) {
      if (!limiter.adaptive) continue

      const utilizationRate = limiter.currentRequests / limiter.maxRequests

      if (utilizationRate > limiter.adaptiveThreshold) {
        limiter.maxRequests = Math.ceil(limiter.maxRequests * (1 + limiter.adaptiveIncrease))
        logger.debug('Rate limit increased', {
          limiter: limiter.name,
          newLimit: limiter.maxRequests
        })
      } else if (utilizationRate < 0.2 && limiter.violations === 0) {
        limiter.maxRequests = Math.ceil(limiter.maxRequests * (1 - limiter.adaptiveDecrease))
        logger.debug('Rate limit decreased', {
          limiter: limiter.name,
          newLimit: limiter.maxRequests
        })
      }
    }
  }

  getLimiterStatus(name) {
    const limiter = this.limiters.get(name)
    if (!limiter) return null

    return {
      name,
      currentRequests: limiter.currentRequests,
      maxRequests: limiter.maxRequests,
      utilizationRate: limiter.currentRequests / limiter.maxRequests,
      violations: limiter.violations,
      retryAfter: limiter.retryAfter,
      timeRemainingInWindow: limiter.windowStart + limiter.windowMs - Date.now()
    }
  }

  getAllStatus() {
    const status = {}
    for (const name of this.limiters.keys()) {
      status[name] = this.getLimiterStatus(name)
    }
    return status
  }

  reset(name) {
    const limiter = this.limiters.get(name)
    if (limiter) {
      limiter.currentRequests = 0
      limiter.windowStart = Date.now()
      limiter.violations = 0
      limiter.retryAfter = null
    }
  }

  resetAll() {
    for (const name of this.limiters.keys()) {
      this.reset(name)
    }
  }

  setAdaptive(enabled) {
    this.adaptive = enabled
    logger.info('Adaptive rate limiting', { enabled })
  }
}
