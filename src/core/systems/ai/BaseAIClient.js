import { StructuredLogger } from '../../utils/logging/index.js'

export class BaseAIClient {
  constructor(name) {
    this.logger = new StructuredLogger(name)
  }

  async wrapCall(fn, operation) {
    try {
      return await fn()
    } catch (err) {
      this.logger.error(`${operation} error`, { error: err.message })
      throw err
    }
  }

  validateResponse(resp, operation) {
    if (!resp) throw new Error(`${operation}: API returned empty response`)
  }
}
