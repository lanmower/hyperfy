export class OperationError extends Error {
  constructor(message, code = 'OPERATION_ERROR', statusCode = 500, details = null) {
    super(message)
    this.name = 'OperationError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.timestamp = new Date().toISOString()
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
    }
  }
}
