/* Standardized error response builders for middleware */

export const ErrorResponses = {
  timeout(timeout, path, method) {
    return {
      error: 'Request timeout',
      message: `Request exceeded ${timeout}ms timeout`,
      path,
      method,
    }
  },

  rateLimitExceeded(limit, current, retryAfter) {
    return {
      error: 'Too Many Requests',
      retryAfter,
      limit,
      current,
    }
  },

  unauthorized(message = 'Authorization required') {
    return {
      error: 'Unauthorized',
      message,
    }
  },

  forbidden(message = 'Forbidden') {
    return {
      error: 'Forbidden',
      message,
    }
  },

  serviceUnavailable(message = 'Service Unavailable') {
    return {
      error: 'Service Unavailable',
      message,
      statusCode: 503,
    }
  },

  corsBlocked(origin) {
    return {
      error: 'Forbidden',
      message: `CORS policy: Origin ${origin} is not allowed`,
      statusCode: 403,
    }
  },
}
