import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('CircuitBreaker')

export class CircuitBreaker {
  constructor(options = {}) {
    this.name = options.name || 'CircuitBreaker'
    this.failureThreshold = options.failureThreshold || 5
    this.successThreshold = options.successThreshold || 2
    this.timeout = options.timeout || 60000
    this.halfOpenTimeout = options.halfOpenTimeout || 30000

    this.state = 'CLOSED'
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = null
    this.nextAttemptTime = null
  }

  async execute(fn, fallback = null) {
    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextAttemptTime) {
        this.state = 'HALF_OPEN'
        this.successCount = 0
        logger.info(`Circuit breaker ${this.name} transitioning to HALF_OPEN`, {})
      } else {
        if (fallback) {
          logger.warn(`Circuit breaker ${this.name} is OPEN, using fallback`, {})
          return fallback()
        }
        throw new Error(`Circuit breaker ${this.name} is OPEN`)
      }
    }

    try {
      const result = await Promise.resolve(fn())
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      if (fallback) {
        logger.warn(`Circuit breaker ${this.name} caught error, using fallback`, { error: error.message })
        return fallback()
      }
      throw error
    }
  }

  onSuccess() {
    this.failureCount = 0

    if (this.state === 'HALF_OPEN') {
      this.successCount++
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED'
        this.successCount = 0
        logger.info(`Circuit breaker ${this.name} recovered to CLOSED`, {})
      }
    }
  }

  onFailure() {
    this.lastFailureTime = Date.now()
    this.failureCount++

    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN'
      this.nextAttemptTime = Date.now() + this.halfOpenTimeout
      logger.error(`Circuit breaker ${this.name} reopened after failure in HALF_OPEN state`, {})
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN'
      this.nextAttemptTime = Date.now() + this.timeout
      logger.error(`Circuit breaker ${this.name} opened after ${this.failureCount} failures`, {
        nextAttempt: new Date(this.nextAttemptTime).toISOString()
      })
    }
  }

  getState() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      nextAttemptTime: this.nextAttemptTime ? new Date(this.nextAttemptTime).toISOString() : null,
    }
  }

  reset() {
    this.state = 'CLOSED'
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = null
    this.nextAttemptTime = null
    logger.info(`Circuit breaker ${this.name} reset`, {})
  }
}

export class CircuitBreakerManager {
  constructor() {
    this.breakers = new Map()
  }

  create(name, options = {}) {
    if (this.breakers.has(name)) {
      return this.breakers.get(name)
    }

    const breaker = new CircuitBreaker({ ...options, name })
    this.breakers.set(name, breaker)
    return breaker
  }

  get(name) {
    return this.breakers.get(name)
  }

  async execute(name, fn, fallback = null) {
    const breaker = this.create(name)
    return breaker.execute(fn, fallback)
  }

  getAll() {
    return Array.from(this.breakers.values()).map(b => b.getState())
  }

  reset(name) {
    const breaker = this.breakers.get(name)
    if (breaker) {
      breaker.reset()
    }
  }

  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset()
    }
  }
}

export const circuitBreakerManager = new CircuitBreakerManager()
