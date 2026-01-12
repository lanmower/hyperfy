import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('AIFunctionCaller')

export class AIFunctionCaller {
  constructor(client) {
    this.client = client
  }

  async call(operation, ...args) {
    const startTime = performance.now()
    try {
      const result = await this.client[operation](...args)
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2)
      logger.info(`AI operation completed`, { operation, elapsed: `${elapsed}s`, provider: this.client.constructor.name })
      return result
    } catch (err) {
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2)
      logger.error(`AI operation failed`, { operation, error: err.message, elapsed: `${elapsed}s` })
      throw err
    }
  }

  async create(prompt) {
    return this.call('create', prompt)
  }

  async edit(code, prompt) {
    return this.call('edit', code, prompt)
  }

  async fix(code, error) {
    return this.call('fix', code, error)
  }

  async classify(prompt) {
    return this.call('classify', prompt)
  }
}
