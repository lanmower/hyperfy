import { LoggerFactory } from '../../core/utils/logging/index.js'

const logger = LoggerFactory.get('RetryManager')

const TRANSIENT_ERRORS = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH',
  'ENETUNREACH', 'ENETRESET', 'ECONNABORTED', 'EPIPE', 'ESOCKETTIMEDOUT',
])

export class RetryManager {
  static isTransientError(error) {
    if (!error) return false

    if (typeof error === 'string') {
      return TRANSIENT_ERRORS.has(error)
    }

    if (error.code && TRANSIENT_ERRORS.has(error.code)) {
      return true
    }

    if (error.message) {
      return TRANSIENT_ERRORS.has(error.message)
    }

    return false
  }

  static calculateBackoff(attempt, baseDelay = 100, maxDelay = 30000) {
    const exponential = baseDelay * Math.pow(2, attempt)
    const jitter = Math.random() * exponential * 0.1
    const delay = Math.min(exponential + jitter, maxDelay)
    return Math.ceil(delay)
  }

  static async execute(fn, maxRetries = 3, baseDelay = 100) {
    if (typeof fn !== 'function') {
      throw new Error('First argument must be a function')
    }

    if (maxRetries < 0) {
      throw new Error('maxRetries must be non-negative')
    }

    let lastError

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn()
        if (attempt > 0) {
          logger.debug('Retry succeeded', {
            attempt,
            totalAttempts: attempt + 1,
          })
        }
        return result
      } catch (err) {
        lastError = err

        if (attempt === maxRetries) {
          logger.error('All retry attempts exhausted', {
            attempts: attempt + 1,
            error: err.message,
            code: err.code,
          })
          throw err
        }

        if (!this.isTransientError(err)) {
          logger.error('Non-transient error, not retrying', {
            error: err.message,
            code: err.code,
          })
          throw err
        }

        const delay = this.calculateBackoff(attempt, baseDelay)
        logger.warn('Retry attempt', {
          attempt: attempt + 1,
          nextRetryIn: `${delay}ms`,
          error: err.message,
        })

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  static async executeWithBackoff(fn, options = {}) {
    const {
      maxRetries = 3,
      baseDelay = 100,
      maxDelay = 30000,
      timeout = null,
      abortSignal = null,
    } = options

    if (typeof fn !== 'function') {
      throw new Error('Function must be provided')
    }

    let lastError

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (abortSignal && abortSignal.aborted) {
        const error = new Error('Retry operation was aborted')
        error.code = 'ABORTED'
        throw error
      }

      try {
        let promise = fn()

        if (timeout) {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => {
              const error = new Error(`Operation timeout after ${timeout}ms`)
              error.code = 'TIMEOUT'
              reject(error)
            }, timeout)
          )
          promise = Promise.race([promise, timeoutPromise])
        }

        const result = await promise

        if (attempt > 0) {
          logger.debug('Backoff retry succeeded', {
            attempt,
            totalAttempts: attempt + 1,
          })
        }

        return result
      } catch (err) {
        lastError = err

        if (abortSignal && abortSignal.aborted) {
          throw err
        }

        if (attempt === maxRetries) {
          logger.error('Backoff retry exhausted', {
            attempts: attempt + 1,
            error: err.message,
            code: err.code,
          })
          throw err
        }

        if (err.code === 'TIMEOUT' || !this.isTransientError(err)) {
          if (err.code !== 'TIMEOUT') {
            logger.error('Non-transient error, stopping retry', {
              error: err.message,
              code: err.code,
            })
          }
          throw err
        }

        const delay = this.calculateBackoff(attempt, baseDelay, maxDelay)
        logger.warn('Backoff retry attempt', {
          attempt: attempt + 1,
          nextRetryIn: `${delay}ms`,
          error: err.message,
        })

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  static async executeWithCircuitBreaker(fn, circuitBreaker) {
    if (!circuitBreaker) {
      return this.execute(fn, 3, 100)
    }

    return circuitBreaker.execute(fn)
  }
}

export function createRetryManager() {
  return RetryManager
}
