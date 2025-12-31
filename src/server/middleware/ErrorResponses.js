import { ErrorResponseBuilder } from '../utils/api/ErrorResponseBuilder.js'

export const ErrorResponses = {
  timeout: (timeout, path, method) =>
    ErrorResponseBuilder.createError('INTERNAL_ERROR', 'Request timeout', { timeout, path, method }),

  rateLimitExceeded: (limit, current, retryAfter) =>
    ErrorResponseBuilder.createError('RATE_LIMIT_EXCEEDED', 'Too Many Requests', { retryAfter, limit, current }),

  unauthorized: (message = 'Authorization required') =>
    ErrorResponseBuilder.createError('UNAUTHORIZED', message),

  forbidden: (message = 'Forbidden') =>
    ErrorResponseBuilder.createError('PERMISSION_DENIED', message),

  serviceUnavailable: (message = 'Service Unavailable') =>
    ErrorResponseBuilder.createError('SERVICE_UNAVAILABLE', message),

  corsBlocked: (origin) =>
    ErrorResponseBuilder.createError('PERMISSION_DENIED', 'CORS policy violation', {
      origin,
      message: `Origin ${origin} is not allowed`,
    }),
}
