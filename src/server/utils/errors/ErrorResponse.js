export class ErrorResponse {
  constructor(statusCode, code, message, details = null, correlationId = null) {
    this.statusCode = statusCode
    this.code = code
    this.message = message
    this.details = details
    this.correlationId = correlationId
    this.timestamp = new Date().toISOString()
  }

  static fromOperationError(error) {
    return new ErrorResponse(error.statusCode, error.code, error.message, error.details)
  }

  static fromError(error, correlationId = null) {
    return new ErrorResponse(500, 'INTERNAL_ERROR', error.message, null, correlationId)
  }

  setCorrelationId(id) {
    this.correlationId = id
    return this
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      correlationId: this.correlationId,
      timestamp: this.timestamp,
    }
  }
}

export class SuccessResponse {
  constructor(data = null, message = 'Success', statusCode = 200) {
    this.data = data
    this.message = message
    this.statusCode = statusCode
    this.timestamp = new Date().toISOString()
  }

  toJSON() {
    return {
      success: true,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp,
    }
  }
}
