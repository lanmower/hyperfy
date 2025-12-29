import { HyperfyError } from './ErrorCodes.js'
import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('ErrorBoundary')

export class ErrorBoundary {
  constructor(context = {}) {
    this.context = context
    this.errors = []
    this.maxErrors = 100
  }

  recordError(error) {
    const errorRecord = {
      timestamp: Date.now(),
      message: error.message,
      code: error.code,
      severity: error.errorInfo?.severity,
      context: error.context,
      stack: error.stack,
    }

    this.errors.push(errorRecord)
    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }

    return errorRecord
  }

  wrap(fn, fallback = null, context = {}) {
    return (...args) => {
      try {
        return fn(...args)
      } catch (error) {
        const hyperfyError = error instanceof HyperfyError ? error : new HyperfyError('OPERATION_NOT_SUPPORTED', error.message, { originalError: error.toString() })
        this.recordError(hyperfyError)
        logger.error('Operation failed', { context: this.context.name || 'Unknown', error: hyperfyError.message, code: hyperfyError.code })

        if (fallback !== null && typeof fallback === 'function') {
          try {
            return fallback(hyperfyError)
          } catch (fallbackError) {
            logger.error('Fallback also failed', { error: fallbackError.message, context: this.context.name || 'Unknown' })
          }
        }

        return fallback
      }
    }
  }

  async wrapAsync(fn, fallback = null, context = {}) {
    try {
      return await fn()
    } catch (error) {
      const hyperfyError = error instanceof HyperfyError ? error : new HyperfyError('OPERATION_NOT_SUPPORTED', error.message, { originalError: error.toString() })
      this.recordError(hyperfyError)
      logger.error('Async operation failed', { context: this.context.name || 'Unknown', error: hyperfyError.message, code: hyperfyError.code })

      if (fallback !== null && typeof fallback === 'function') {
        try {
          return await fallback(hyperfyError)
        } catch (fallbackError) {
          logger.error('Async fallback also failed', { error: fallbackError.message, context: this.context.name || 'Unknown' })
        }
      }

      return fallback
    }
  }

  withFallback(primaryFn, fallbackValue) {
    return (...args) => {
      try {
        const result = primaryFn(...args)
        return result ?? fallbackValue
      } catch (error) {
        const hyperfyError = error instanceof HyperfyError ? error : new HyperfyError('OPERATION_NOT_SUPPORTED', error.message)
        this.recordError(hyperfyError)
        return fallbackValue
      }
    }
  }

  getErrors(severity = null) {
    if (!severity) return this.errors
    return this.errors.filter(e => e.severity === severity)
  }

  clearErrors() {
    this.errors = []
  }

  getLastError() {
    return this.errors[this.errors.length - 1] || null
  }
}

export default ErrorBoundary
