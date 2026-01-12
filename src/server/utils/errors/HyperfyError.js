export class HyperfyError extends Error {
  constructor(message, code = 'INTERNAL_ERROR', statusCode = 500, details = null) {
    super(message)
    this.name = 'HyperfyError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.correlationId = null
    this.timestamp = new Date().toISOString()
  }

  setCorrelationId(id) {
    this.correlationId = id
    return this
  }

  static fromError(error, code = 'INTERNAL_ERROR', correlationId = null) {
    const err = new HyperfyError(error.message, code, 500, null)
    if (correlationId) err.correlationId = correlationId
    return err
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
