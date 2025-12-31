import { LoggerFactory } from '../../../core/utils/logging/index.js'
import { ErrorResponseBuilder } from './ErrorResponseBuilder.js'
import { HyperfyError } from '../errors/HyperfyError.js'
import { OperationError } from '../errors/OperationError.js'

const logger = LoggerFactory.get('APIMethodWrapper')

export class APIMethodWrapper {
  static async wrapMethod(fn, options = {}) {
    const { logger: customLogger, defaultErrorCode = 500, defaultReturn = null } = options

    try {
      const result = await fn()
      return result
    } catch (error) {
      const errorLogger = customLogger || logger

      if (error instanceof OperationError) {
        errorLogger.error(error.message, error.toJSON())
        return {
          error: error.message,
          code: error.code,
          context: error.context,
          correlationId: error.correlationId,
        }
      }

      errorLogger.error(error.message, { stack: error.stack })
      return {
        error: error.message || 'Operation failed',
        code: defaultErrorCode,
      }
    }
  }

  static async wrapFastifyMethod(fn, reply, options = {}) {
    const { logger: customLogger, defaultMessage = 'Operation failed' } = options
    const errorLogger = customLogger || logger

    try {
      const result = await fn()
      return result
    } catch (error) {
      if (error instanceof (OperationError || HyperfyError)) {
        errorLogger.error(error.message, error.toJSON?.() || error)
        const details = { context: error.context }
        if (error.correlationId) details.requestId = error.correlationId
        return ErrorResponseBuilder.sendError(reply, error.code, error.message, details)
      }

      errorLogger.error(error.message, { stack: error.stack })
      return ErrorResponseBuilder.sendError(reply, 'INTERNAL_ERROR', error.message || defaultMessage)
    }
  }
}
