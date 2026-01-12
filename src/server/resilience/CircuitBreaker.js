import { LoggerFactory } from '../../core/utils/logging/index.js'

const logger = LoggerFactory.get('CircuitBreaker')

const STATE = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
}

export class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name
    this.state = STATE.CLOSED
    this.failureThreshold = options.failureThreshold || 5
    this.successThreshold = options.successThreshold || 2
    this.timeout = options.timeout || 60000
    this.failureCount = 0
    this.successCount = 0
    this.nextAttempt = Date.now()
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      rejectedCalls: 0,
      stateTransitions: [],
    }
    this.lastError = null
  }

  async execute(fn) {
    this.metrics.totalCalls++

    if (this.state === STATE.OPEN) {
      if (Date.now() < this.nextAttempt) {
        this.metrics.rejectedCalls++
        const error = new Error(`Circuit breaker [${this.name}] is OPEN - service unavailable`)
        error.code = 'CIRCUIT_OPEN'
        error.circuitBreaker = this.name
        throw error
      }
      this.transition(STATE.HALF_OPEN)
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure(error)
      throw error
    }
  }

  onSuccess() {
    this.metrics.successfulCalls++
    this.failureCount = 0

    if (this.state === STATE.HALF_OPEN) {
      this.successCount++
      if (this.successCount >= this.successThreshold) {
        this.transition(STATE.CLOSED)
      }
    }
  }

  onFailure(error) {
    this.metrics.failedCalls++
    this.lastError = {
      message: error.message,
      code: error.code,
      timestamp: Date.now(),
    }
    this.failureCount++
    this.successCount = 0

    if (this.state === STATE.HALF_OPEN) {
      this.transition(STATE.OPEN)
    } else if (this.failureCount >= this.failureThreshold) {
      this.transition(STATE.OPEN)
    }
  }

  transition(newState) {
    const oldState = this.state
    this.state = newState

    const transition = {
      from: oldState,
      to: newState,
      timestamp: Date.now(),
      failureCount: this.failureCount,
    }

    this.metrics.stateTransitions.push(transition)
    if (this.metrics.stateTransitions.length > 100) {
      this.metrics.stateTransitions.shift()
    }

    logger.info('Circuit breaker state transition', {
      name: this.name,
      from: oldState,
      to: newState,
      failureCount: this.failureCount,
      successCount: this.successCount,
    })

    if (newState === STATE.OPEN) {
      this.nextAttempt = Date.now() + this.timeout
    } else if (newState === STATE.CLOSED) {
      this.failureCount = 0
      this.successCount = 0
    } else if (newState === STATE.HALF_OPEN) {
      this.successCount = 0
    }
  }

  reset() {
    this.failureCount = 0
    this.successCount = 0
    this.lastError = null
    this.transition(STATE.CLOSED)
  }

  getStats() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      failureThreshold: this.failureThreshold,
      successThreshold: this.successThreshold,
      timeout: this.timeout,
      nextAttempt: this.state === STATE.OPEN ? this.nextAttempt : null,
      lastError: this.lastError,
      metrics: {
        totalCalls: this.metrics.totalCalls,
        successfulCalls: this.metrics.successfulCalls,
        failedCalls: this.metrics.failedCalls,
        rejectedCalls: this.metrics.rejectedCalls,
        successRate: this.metrics.totalCalls > 0
          ? (this.metrics.successfulCalls / this.metrics.totalCalls * 100).toFixed(2)
          : 0,
        recentTransitions: this.metrics.stateTransitions.slice(-10),
      },
    }
  }
}
