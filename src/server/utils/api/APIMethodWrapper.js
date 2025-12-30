/* APIMethodWrapper: Wraps async methods with error handling and logging */
import { ComponentLogger } from '../../core/utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('APIMethodWrapper')

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
    const { logger: customLogger, defaultStatusCode = 500, defaultMessage = 'Operation failed' } = options
    const errorLogger = customLogger || logger

    try {
      const result = await fn()
      return result
    } catch (error) {
      if (error instanceof OperationError) {
        errorLogger.error(error.message, error.toJSON())
        return reply.code(error.statusCode).send({
          error: error.message,
          code: error.code,
          context: error.context,
          correlationId: error.correlationId,
        })
      }

      errorLogger.error(error.message, { stack: error.stack })
      return reply.code(defaultStatusCode).send({
        error: error.message || defaultMessage,
      })
    }
  }
}
