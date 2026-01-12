// Unified response building for all API endpoints - single source of truth
export class ResponseBuilder {
  static success(data = {}, statusCode = 200, message = 'Success') {
    return {
      status: statusCode,
      success: true,
      message,
      ...data,
    }
  }

  static error(message, statusCode = 400, details = null) {
    const response = {
      status: statusCode,
      success: false,
      message,
    }
    if (details) {
      response.details = details
    }
    return response
  }

  static notFound(resource) {
    return this.error(`${resource} not found`, 404)
  }

  static unauthorized() {
    return this.error('Unauthorized', 401)
  }

  static forbidden() {
    return this.error('Forbidden', 403)
  }

  static badRequest(message, details) {
    return this.error(message || 'Invalid request', 400, details)
  }

  static validationError(errors) {
    return this.error('Validation failed', 400, errors)
  }

  static serviceUnavailable(service) {
    return this.error(`${service} service unavailable`, 503)
  }

  static internalError(message = 'Internal server error') {
    return this.error(message, 500)
  }

  static paginated(data, total, page, pageSize) {
    return this.success({
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  }

  static created(data) {
    return this.success(data, 201, 'Created')
  }

  static updated(data) {
    return this.success(data, 200, 'Updated')
  }

  static deleted(resource) {
    return this.success({ deleted: true }, 200, `${resource} deleted`)
  }
}

// Helper to wrap reply.send() calls with consistent formatting
export function sendResponse(reply, response, statusCode) {
  return reply.code(statusCode || response.status || 200).send(response)
}
