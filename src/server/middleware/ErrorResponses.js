/* Standardized error response builders for middleware */
import { ErrorResponseBuilder } from '../utils/api/ErrorResponseBuilder.js'

export const ErrorResponses = {
  timeout(timeout, path, method) {
    return ErrorResponseBuilder.createError('INTERNAL_ERROR', 'Request timeout', {
      timeout,
      path,
      method,
    })
  },

  rateLimitExceeded(limit, current, retryAfter) {
    return ErrorResponseBuilder.createError('RATE_LIMIT_EXCEEDED', 'Too Many Requests', {
      retryAfter,
      limit,
      current,
    })
  },

  unauthorized(message = 'Authorization required') {
    return ErrorResponseBuilder.createError('UNAUTHORIZED', message)
  },

  forbidden(message = 'Forbidden') {
    return ErrorResponseBuilder.createError('PERMISSION_DENIED', message)
  },

  serviceUnavailable(message = 'Service Unavailable') {
    return ErrorResponseBuilder.createError('SERVICE_UNAVAILABLE', message)
  },

  corsBlocked(origin) {
    return ErrorResponseBuilder.createError('PERMISSION_DENIED', 'CORS policy violation', {
      origin,
      message: `Origin ${origin} is not allowed`,
    })
  },
}
