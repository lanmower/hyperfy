/* ErrorResponseBuilder: Standardizes error responses across server */

const HTTP_STATUS_MAP = {
  INPUT_VALIDATION: 400,
  NOT_FOUND: 404,
  PERMISSION_DENIED: 403,
  RATE_LIMIT_EXCEEDED: 429,
  INVALID_STATE: 500,
  INTERNAL_ERROR: 500,
  UNAUTHORIZED: 401,
  SERVICE_UNAVAILABLE: 503,
}

export class ErrorResponseBuilder {
  static createError(code, message, details = {}) {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
    }
  }

  static getHttpStatus(code) {
    return HTTP_STATUS_MAP[code] || 500
  }

  static sendError(reply, code, message, details = {}) {
    const statusCode = this.getHttpStatus(code)
    const errorResponse = this.createError(code, message, details)
    return reply.code(statusCode).send(errorResponse)
  }

  static sendErrorFromException(reply, exception, requestId = null) {
    const code = exception.code || 'INTERNAL_ERROR'
    const message = exception.message || 'An unexpected error occurred'
    const details = {}

    if (requestId) {
      details.requestId = requestId
    }

    if (process.env.NODE_ENV !== 'production' && exception.stack) {
      details.stack = exception.stack
    }

    const statusCode = this.getHttpStatus(code)
    const errorResponse = this.createError(code, message, details)
    return reply.code(statusCode).send(errorResponse)
  }
}
