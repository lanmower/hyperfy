const OperationErrorCodes = {
  OP_TIMEOUT: 'OP_TIMEOUT',
  OP_NETWORK: 'OP_NETWORK',
  OP_DATABASE: 'OP_DATABASE',
  OP_AUTH: 'OP_AUTH',
  OP_VALIDATION: 'OP_VALIDATION',
  OP_NOT_FOUND: 'OP_NOT_FOUND',
  OP_CONFLICT: 'OP_CONFLICT',
  OP_RATE_LIMIT: 'OP_RATE_LIMIT',
  OP_INTERNAL: 'OP_INTERNAL',
}

export class OperationError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'OperationError'
    this.code = options.code || 'OP_INTERNAL'
    this.context = options.context || {}
    this.cause = options.cause || null
    this.correlationId = options.correlationId || this.generateCorrelationId()
    this.timestamp = Date.now()
    this.level = options.level || 'error'
    this.statusCode = options.statusCode || 500

    if (options.cause instanceof Error) {
      this.stack = this.stack + '\nCaused by: ' + options.cause.stack
    }
  }

  generateCorrelationId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`
  }

  toJSON() {
    return {
      level: this.level,
      message: this.message,
      code: this.code,
      context: this.context,
      correlationId: this.correlationId,
      timestamp: this.timestamp,
      stack: this.stack?.split('\n').slice(0, 10) || null,
      cause: this.cause ? this.cause.message : null,
    }
  }

  static timeout(message, context = {}) {
    return new OperationError(message, {
      code: OperationErrorCodes.OP_TIMEOUT,
      context,
      level: 'error',
      statusCode: 504,
    })
  }

  static network(message, context = {}) {
    return new OperationError(message, {
      code: OperationErrorCodes.OP_NETWORK,
      context,
      level: 'error',
      statusCode: 503,
    })
  }

  static database(message, context = {}) {
    return new OperationError(message, {
      code: OperationErrorCodes.OP_DATABASE,
      context,
      level: 'error',
      statusCode: 500,
    })
  }

  static auth(message, context = {}) {
    return new OperationError(message, {
      code: OperationErrorCodes.OP_AUTH,
      context,
      level: 'error',
      statusCode: 401,
    })
  }

  static validation(message, context = {}) {
    return new OperationError(message, {
      code: OperationErrorCodes.OP_VALIDATION,
      context,
      level: 'error',
      statusCode: 400,
    })
  }

  static notFound(message, context = {}) {
    return new OperationError(message, {
      code: OperationErrorCodes.OP_NOT_FOUND,
      context,
      level: 'error',
      statusCode: 404,
    })
  }

  static conflict(message, context = {}) {
    return new OperationError(message, {
      code: OperationErrorCodes.OP_CONFLICT,
      context,
      level: 'error',
      statusCode: 409,
    })
  }

  static rateLimit(message, context = {}) {
    return new OperationError(message, {
      code: OperationErrorCodes.OP_RATE_LIMIT,
      context,
      level: 'warn',
      statusCode: 429,
    })
  }

  static internal(message, context = {}) {
    return new OperationError(message, {
      code: OperationErrorCodes.OP_INTERNAL,
      context,
      level: 'error',
      statusCode: 500,
    })
  }
}

export { OperationErrorCodes }
