import { HyperfyError } from '../../systems/error/ErrorCodes.js'

export class ErrorHandlingUtils {
  static convertToHyperfyError(err, code, message, context = {}) {
    if (err instanceof HyperfyError) {
      return err
    }
    return new HyperfyError(code, message, {
      originalError: err.toString(),
      ...context,
    })
  }

  static wrapAsync(asyncFn, code, message, context = {}) {
    return async (...args) => {
      try {
        return await asyncFn(...args)
      } catch (err) {
        throw this.convertToHyperfyError(err, code, message, context)
      }
    }
  }

  static safeExecute(fn, code, message, context = {}) {
    try {
      return fn()
    } catch (err) {
      throw this.convertToHyperfyError(err, code, message, context)
    }
  }
}
