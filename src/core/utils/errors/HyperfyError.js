// Client/server compatible error class
export class HyperfyError extends Error {
  constructor(code = 'INTERNAL_ERROR', message = '', details = null) {
    super(message)
    this.name = 'HyperfyError'
    this.code = code
    this.statusCode = 500
    this.details = details
    this.correlationId = null
    this.timestamp = new Date().toISOString()
  }

  setCorrelationId(id) {
    this.correlationId = id
    return this
  }

  static fromError(error, code = 'INTERNAL_ERROR', correlationId = null) {
    const err = new HyperfyError(code, error.message)
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
