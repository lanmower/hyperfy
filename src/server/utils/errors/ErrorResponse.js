const logger = console

export class ErrorResponse {
  constructor(statusCode = 500, message = 'Internal Server Error') {
    this.statusCode = statusCode
    this.message = message
    this.code = null
    this.details = null
    this.context = null
    this.correlationId = null
    this.timestamp = new Date().toISOString()
  }

  setCode(code) {
    this.code = code
    return this
  }

  setDetails(details) {
    this.details = details
    return this
  }

  setContext(context) {
    this.context = context
    return this
  }

  setCorrelationId(correlationId) {
    this.correlationId = correlationId
    return this
  }

  setTimestamp(timestamp) {
    this.timestamp = timestamp
    return this
  }

  toJSON() {
    const payload = {
      status: this.statusCode,
      message: this.message,
      timestamp: this.timestamp,
    }

    if (this.code) {
      payload.code = this.code
    }

    if (this.details) {
      payload.details = this.details
    }

    if (this.correlationId) {
      payload.correlationId = this.correlationId
    }

    if (this.context) {
      payload.context = this.context
    }

    return payload
  }

  static ok(data = null, message = null) {
    const response = new ErrorResponse(200, message || 'OK')
    if (data !== null) {
      response.details = data
    }
    return response
  }

  static created(data = null, message = null) {
    const response = new ErrorResponse(201, message || 'Created')
    if (data !== null) {
      response.details = data
    }
    return response
  }

  static noContent() {
    return new ErrorResponse(204, 'No Content')
  }

  static badRequest(message, details = null) {
    const response = new ErrorResponse(400, message || 'Bad Request')
    response.code = 'BAD_REQUEST'
    if (details) {
      response.setDetails(details)
    }
    return response
  }

  static unauthorized(message) {
    const response = new ErrorResponse(401, message || 'Unauthorized')
    response.code = 'UNAUTHORIZED'
    return response
  }

  static forbidden(message) {
    const response = new ErrorResponse(403, message || 'Forbidden')
    response.code = 'FORBIDDEN'
    return response
  }

  static notFound(message, resource = null) {
    const response = new ErrorResponse(404, message || 'Not Found')
    response.code = 'NOT_FOUND'
    if (resource) {
      response.setContext({ resource })
    }
    return response
  }

  static conflict(message, details = null) {
    const response = new ErrorResponse(409, message || 'Conflict')
    response.code = 'CONFLICT'
    if (details) {
      response.setDetails(details)
    }
    return response
  }

  static tooLarge(message) {
    const response = new ErrorResponse(413, message || 'Payload Too Large')
    response.code = 'PAYLOAD_TOO_LARGE'
    return response
  }

  static tooManyRequests(message, retryAfter = null) {
    const response = new ErrorResponse(429, message || 'Too Many Requests')
    response.code = 'RATE_LIMIT_EXCEEDED'
    if (retryAfter) {
      response.setContext({ retryAfter })
    }
    return response
  }

  static timeout(message) {
    const response = new ErrorResponse(408, message || 'Request Timeout')
    response.code = 'REQUEST_TIMEOUT'
    return response
  }

  static internalError(message, code = null) {
    const response = new ErrorResponse(500, message || 'Internal Server Error')
    response.code = code || 'INTERNAL_ERROR'
    return response
  }

  static serviceUnavailable(message, details = null) {
    const response = new ErrorResponse(503, message || 'Service Unavailable')
    response.code = 'SERVICE_UNAVAILABLE'
    if (details) {
      response.setDetails(details)
    }
    return response
  }

  static gatewayTimeout(message) {
    const response = new ErrorResponse(504, message || 'Gateway Timeout')
    response.code = 'GATEWAY_TIMEOUT'
    return response
  }

  static fromOperationError(operationError) {
    let statusCode = 500
    const codeToStatus = {
      OP_TIMEOUT: 504,
      OP_NETWORK: 503,
      OP_DATABASE: 500,
      OP_AUTH: 401,
      OP_VALIDATION: 400,
      OP_NOT_FOUND: 404,
      OP_CONFLICT: 409,
      OP_RATE_LIMIT: 429,
      OP_INTERNAL: 500,
    }

    if (operationError.code in codeToStatus) {
      statusCode = codeToStatus[operationError.code]
    }

    const response = new ErrorResponse(statusCode, operationError.message)
    response.setCode(operationError.code)

    if (operationError.context) {
      response.setContext(operationError.context)
    }

    if (operationError.correlationId) {
      response.setCorrelationId(operationError.correlationId)
    }

    return response
  }

  static fromError(error, requestId = null) {
    const response = new ErrorResponse(500, error.message || 'Internal Server Error')
    response.code = 'UNHANDLED_ERROR'

    if (requestId) {
      response.setCorrelationId(requestId)
    }

    if (error.statusCode) {
      response.statusCode = error.statusCode
    }

    return response
  }
}

export class SuccessResponse {
  constructor(data = null, message = null) {
    this.statusCode = 200
    this.message = message || 'OK'
    this.data = data
    this.timestamp = new Date().toISOString()
  }

  setStatusCode(code) {
    this.statusCode = code
    return this
  }

  setMessage(message) {
    this.message = message
    return this
  }

  toJSON() {
    const payload = {
      status: this.statusCode,
      message: this.message,
      timestamp: this.timestamp,
    }

    if (this.data !== null && this.data !== undefined) {
      payload.data = this.data
    }

    return payload
  }

  static ok(data = null, message = null) {
    return new SuccessResponse(data, message || 'OK')
  }

  static created(data = null, message = null) {
    return new SuccessResponse(data, message || 'Created').setStatusCode(201)
  }

  static noContent() {
    const response = new SuccessResponse(null, 'No Content')
    response.setStatusCode(204)
    return response
  }
}
