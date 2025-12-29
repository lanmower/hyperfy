import { HyperfyError } from './ErrorCodes.js'
import ErrorBoundary from './ErrorBoundary.js'
import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('ErrorRecoveryPattern')

export class ErrorRecoveryPattern {
  static createErrorContext(systemName) {
    return {
      systemName,
      boundary: new ErrorBoundary({ name: systemName }),
      recoveryStrategies: new Map(),

      registerRecovery(errorCode, strategy) {
        this.recoveryStrategies.set(errorCode, strategy)
      },

      handle(error, operation = 'unknown') {
        const context = {
          operation,
          systemName: this.systemName,
          timestamp: Date.now(),
        }

        let hyperfyError = error
        if (!(error instanceof HyperfyError)) {
          hyperfyError = new HyperfyError('OPERATION_NOT_SUPPORTED', error.message, {
            operation,
            originalError: error.toString(),
          })
        }

        this.boundary.recordError(hyperfyError)

        const strategy = this.recoveryStrategies.get(hyperfyError.code)
        if (strategy) {
          try {
            return strategy(hyperfyError, context)
          } catch (strategyErr) {
            logger.error('Recovery strategy failed', { system: this.systemName, error: strategyErr })
            return null
          }
        }

        return null
      },

      withRecovery(fn, operation = 'unknown', fallback = null) {
        try {
          return fn()
        } catch (err) {
          const recovered = this.handle(err, operation)
          if (recovered !== null) {
            return recovered
          }
          if (fallback !== null && typeof fallback === 'function') {
            try {
              return fallback(err)
            } catch (fallbackErr) {
              logger.error('Fallback also failed', { system: this.systemName, error: fallbackErr })
            }
          }
          return fallback
        }
      },

      async withAsyncRecovery(fn, operation = 'unknown', fallback = null) {
        try {
          return await fn()
        } catch (err) {
          const recovered = this.handle(err, operation)
          if (recovered !== null) {
            return recovered
          }
          if (fallback !== null && typeof fallback === 'function') {
            try {
              return await fallback(err)
            } catch (fallbackErr) {
              logger.error('Async fallback also failed', { system: this.systemName, error: fallbackErr })
            }
          }
          return fallback
        }
      },

      getErrors(severity = null) {
        return this.boundary.getErrors(severity)
      },

      getLastError() {
        return this.boundary.getLastError()
      },

      clearErrors() {
        this.boundary.clearErrors()
      },
    }
  }

  static createStandardRecoveries() {
    return {
      NULL_REFERENCE: (error, context) => {
        logger.warn('Null reference in operation', { system: context.systemName, operation: context.operation, error: error.message })
        return null
      },

      INVALID_STATE: (error, context) => {
        logger.warn('Invalid state for operation', { system: context.systemName, operation: context.operation, error: error.message })
        return null
      },

      RESOURCE_NOT_FOUND: (error, context) => {
        logger.warn('Resource not found for operation', { system: context.systemName, operation: context.operation, error: error.message })
        return null
      },

      TYPE_MISMATCH: (error, context) => {
        logger.warn('Type mismatch in operation', { system: context.systemName, operation: context.operation, error: error.message })
        return null
      },

      INPUT_VALIDATION: (error, context) => {
        logger.warn('Input validation failed for operation', { system: context.systemName, operation: context.operation, error: error.message })
        return null
      },

      PERMISSION_DENIED: (error, context) => {
        logger.warn('Permission denied for operation', { system: context.systemName, operation: context.operation, error: error.message })
        return null
      },

      RESOURCE_LIMIT: (error, context) => {
        logger.warn('Resource limit exceeded for operation', { system: context.systemName, operation: context.operation, error: error.message })
        return null
      },

      SCRIPT_ERROR: (error, context) => {
        logger.error('Script error in operation', { system: context.systemName, operation: context.operation, error: error.message })
        return null
      },

      NETWORK_FAILURE: (error, context) => {
        logger.error('Network failure in operation', { system: context.systemName, operation: context.operation, error: error.message })
        return null
      },

      PHYSICS_ERROR: (error, context) => {
        logger.error('Physics error in operation', { system: context.systemName, operation: context.operation, error: error.message })
        return null
      },
    }
  }

  static setupSystemErrorHandling(system, systemName) {
    const errorContext = this.createErrorContext(systemName)
    const standardRecoveries = this.createStandardRecoveries()

    for (const [code, strategy] of Object.entries(standardRecoveries)) {
      errorContext.registerRecovery(code, strategy)
    }

    system.__errorContext = errorContext
    return errorContext
  }

  static throwIfInvalid(value, type, paramName, context = {}) {
    if (value === null || value === undefined) {
      throw new HyperfyError('NULL_REFERENCE', `${paramName} is null or undefined`, context)
    }

    if (type) {
      const expectedType = typeof value
      if (expectedType !== type) {
        throw new HyperfyError('TYPE_MISMATCH', `${paramName} must be ${type}, got ${expectedType}`, {
          ...context,
          expected: type,
          actual: expectedType,
        })
      }
    }

    return value
  }
}

export default ErrorRecoveryPattern
