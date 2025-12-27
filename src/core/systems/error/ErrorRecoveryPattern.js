import { HyperfyError } from './ErrorCodes.js'
import ErrorBoundary from './ErrorBoundary.js'

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
            console.error(`[${this.systemName}] Recovery strategy failed:`, strategyErr)
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
              console.error(`[${this.systemName}] Fallback also failed:`, fallbackErr)
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
              console.error(`[${this.systemName}] Async fallback also failed:`, fallbackErr)
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
        console.warn(`[${context.systemName}] Null reference in ${context.operation}:`, error.message)
        return null
      },

      INVALID_STATE: (error, context) => {
        console.warn(`[${context.systemName}] Invalid state for ${context.operation}:`, error.message)
        return null
      },

      RESOURCE_NOT_FOUND: (error, context) => {
        console.warn(`[${context.systemName}] Resource not found for ${context.operation}:`, error.message)
        return null
      },

      TYPE_MISMATCH: (error, context) => {
        console.warn(`[${context.systemName}] Type mismatch in ${context.operation}:`, error.message)
        return null
      },

      INPUT_VALIDATION: (error, context) => {
        console.warn(`[${context.systemName}] Input validation failed for ${context.operation}:`, error.message)
        return null
      },

      PERMISSION_DENIED: (error, context) => {
        console.warn(`[${context.systemName}] Permission denied for ${context.operation}:`, error.message)
        return null
      },

      RESOURCE_LIMIT: (error, context) => {
        console.warn(`[${context.systemName}] Resource limit exceeded for ${context.operation}:`, error.message)
        return null
      },

      SCRIPT_ERROR: (error, context) => {
        console.error(`[${context.systemName}] Script error in ${context.operation}:`, error.message)
        return null
      },

      NETWORK_FAILURE: (error, context) => {
        console.error(`[${context.systemName}] Network failure in ${context.operation}:`, error.message)
        return null
      },

      PHYSICS_ERROR: (error, context) => {
        console.error(`[${context.systemName}] Physics error in ${context.operation}:`, error.message)
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
