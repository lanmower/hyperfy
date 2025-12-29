import { ComponentLogger } from '../utils/logging/ComponentLogger.js'
import { isAppError } from '../utils/error/AppError.js'

const logger = new ComponentLogger('ErrorHandler')

export class ErrorHandler {
  constructor(systemName = 'Unknown') {
    this.systemName = systemName
    this.errorHandlers = new Map()
    this.errorFilters = []
    this.recoveryStrategies = new Map()
  }

  registerHandler(code, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function')
    }
    this.errorHandlers.set(code, handler)
    return this
  }

  registerRecovery(code, strategy) {
    if (typeof strategy !== 'function') {
      throw new Error('Recovery strategy must be a function')
    }
    this.recoveryStrategies.set(code, strategy)
    return this
  }

  addFilter(predicate) {
    if (typeof predicate !== 'function') {
      throw new Error('Filter must be a function')
    }
    this.errorFilters.push(predicate)
    return this
  }

  handle(error, context = {}) {
    try {
      const shouldHandle = this.errorFilters.every(filter => filter(error, context))
      if (!shouldHandle) {
        return { handled: false, error }
      }

      const code = error.code || 'UNKNOWN'
      const handler = this.errorHandlers.get(code)

      if (handler) {
        const result = handler(error, context)
        logger.info('Error handled', { code, system: this.systemName, ...context })
        return { handled: true, error, result }
      }

      return { handled: false, error }
    } catch (err) {
      logger.error('Error handler failed', { system: this.systemName, error: err.message })
      return { handled: false, error, handlerError: err }
    }
  }

  async recover(error, context = {}) {
    try {
      const code = error.code || 'UNKNOWN'
      const strategy = this.recoveryStrategies.get(code)

      if (!strategy) {
        return { recovered: false, error }
      }

      const result = await strategy(error, context)
      logger.info('Error recovered', { code, system: this.systemName, ...context })
      return { recovered: true, error, result }
    } catch (err) {
      logger.error('Recovery failed', { system: this.systemName, error: err.message })
      return { recovered: false, error, recoveryError: err }
    }
  }

  async handleAndRecover(error, context = {}) {
    const handleResult = this.handle(error, context)

    if (handleResult.handled) {
      return { handled: true, recovered: false, ...handleResult }
    }

    const recoverResult = await this.recover(error, context)
    return { ...recoverResult }
  }

  logError(error, level = 'error', context = {}) {
    if (isAppError(error)) {
      logger[level](error.toDetailedString(), context)
    } else {
      logger[level](error.message, { ...context, error: error.toString() })
    }
  }

  clear() {
    this.errorHandlers.clear()
    this.recoveryStrategies.clear()
    this.errorFilters = []
  }

  getStats() {
    return {
      handlerCount: this.errorHandlers.size,
      recoveryCount: this.recoveryStrategies.size,
      filterCount: this.errorFilters.length
    }
  }
}
