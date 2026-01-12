import { CircuitBreaker } from './CircuitBreaker.js'
import { BaseManager } from '../../core/patterns/index.js'

export class CircuitBreakerManager extends BaseManager {
  constructor() {
    super(null, 'CircuitBreakerManager')
    this.breakers = new Map()
  }

  register(name, options = {}) {
    if (this.breakers.has(name)) {
      this.logger.warn('Circuit breaker already registered', { name })
      return this.breakers.get(name)
    }

    const breaker = new CircuitBreaker(name, options)
    this.breakers.set(name, breaker)
    this.logger.info('Circuit breaker registered', { name, options })
    return breaker
  }

  get(name) {
    const breaker = this.breakers.get(name)
    if (!breaker) {
      throw new Error(`Circuit breaker ${name} not found`)
    }
    return breaker
  }

  has(name) {
    return this.breakers.has(name)
  }

  async execute(name, fn) {
    const breaker = this.get(name)
    return breaker.execute(fn)
  }

  reset(name) {
    if (name) {
      const breaker = this.get(name)
      breaker.reset()
      this.logger.info('Circuit breaker reset', { name })
    } else {
      for (const [breakerName, breaker] of this.breakers) {
        breaker.reset()
      }
      this.logger.info('All circuit breakers reset', { count: this.breakers.size })
    }
  }

  getStats(name) {
    if (name) {
      const breaker = this.get(name)
      return breaker.getStats()
    }

    const stats = {}
    for (const [breakerName, breaker] of this.breakers) {
      stats[breakerName] = breaker.getStats()
    }
    return stats
  }

  getAllStats() {
    const stats = {
      breakers: {},
      summary: {
        total: this.breakers.size,
        open: 0,
        halfOpen: 0,
        closed: 0,
      },
    }

    for (const [name, breaker] of this.breakers) {
      const breakerStats = breaker.getStats()
      stats.breakers[name] = breakerStats

      if (breakerStats.state === 'OPEN') stats.summary.open++
      else if (breakerStats.state === 'HALF_OPEN') stats.summary.halfOpen++
      else if (breakerStats.state === 'CLOSED') stats.summary.closed++
    }

    return stats
  }

  async initInternal() {
  }

  async destroyInternal() {
    for (const breaker of this.breakers.values()) {
      breaker.reset()
    }
    this.breakers.clear()
  }
}

export const globalCircuitBreakerManager = new CircuitBreakerManager()
