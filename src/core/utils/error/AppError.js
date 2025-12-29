import { ErrorCodes, getErrorCategory } from './ErrorCodes.js'

export class AppError extends Error {
  constructor(code, message, context = {}, cause = null) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.context = context
    this.cause = cause
    this.timestamp = Date.now()
    this.category = getErrorCategory(code)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  static system(message, context, cause) {
    return new AppError(ErrorCodes.SYSTEM.INITIALIZATION_FAILED, message, context, cause)
  }

  static network(code, message, context, cause) {
    return new AppError(code, message, context, cause)
  }

  static entity(code, message, context, cause) {
    return new AppError(code, message, context, cause)
  }

  static asset(code, message, context, cause) {
    return new AppError(code, message, context, cause)
  }

  static blueprint(code, message, context, cause) {
    return new AppError(code, message, context, cause)
  }

  static script(code, message, context, cause) {
    return new AppError(code, message, context, cause)
  }

  static validation(message, context, cause) {
    return new AppError(ErrorCodes.VALIDATION.INVALID_INPUT, message, context, cause)
  }

  static permission(message, context, cause) {
    return new AppError(ErrorCodes.PERMISSION.DENIED, message, context, cause)
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      category: this.category,
      message: this.message,
      context: this.context,
      cause: this.cause?.toJSON?.() || this.cause?.message,
      timestamp: this.timestamp,
      stack: this.stack
    }
  }

  toShortString() {
    return `${this.code}: ${this.message}`
  }

  toDetailedString() {
    const parts = [
      `[${this.code}] ${this.message}`,
      `Category: ${this.category}`,
      `Timestamp: ${new Date(this.timestamp).toISOString()}`
    ]

    if (Object.keys(this.context).length > 0) {
      parts.push(`Context: ${JSON.stringify(this.context)}`)
    }

    if (this.cause) {
      parts.push(`Caused by: ${this.cause.message || this.cause}`)
    }

    return parts.join('\n')
  }
}

export function isAppError(err) {
  return err instanceof AppError
}

export function wrapError(err, code, message, context) {
  if (isAppError(err)) {
    return err
  }

  return new AppError(code, message || err.message, context, err)
}
