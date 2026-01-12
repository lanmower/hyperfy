import { System } from './System.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('ErrorSystem')

export class ErrorSystem extends System {
  constructor(world) {
    super(world)
    this.isServer = world.isServer
    this.isClient = !world.isServer
    this.errors = []
    this.maxErrors = 500
    this.listeners = new Set()
    this.handlers = new Map()
    this.errorStats = { total: 0, byType: {}, byLevel: {} }
    this.criticalPatterns = new Set([
      'NETWORK_ERROR',
      'SCRIPT_ERROR',
      'PHYSICS_ERROR',
      'RENDERING_ERROR',
      'DATABASE_ERROR',
      'VALIDATION_ERROR'
    ])
  }

  report(error, context = {}) {
    const errorEntry = {
      id: this.errors.length,
      message: error.message || String(error),
      stack: error.stack || '',
      code: error.code || 'UNKNOWN',
      timestamp: Date.now(),
      side: this.isServer ? 'server' : 'client',
      level: context.level || 'error',
      type: context.type || 'generic',
      ...context
    }

    this.errors.push(errorEntry)
    if (this.errors.length > this.maxErrors) this.errors.shift()

    this.updateStats(errorEntry)
    logger.error('Error reported', { side: errorEntry.side, message: errorEntry.message, code: errorEntry.code })

    this.notifyListeners(errorEntry)

    if (!this.isServer && this.world.network?.connected) {
      this.world.network.send('ERROR_REPORT', errorEntry)
    }
  }

  registerHandler(code, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function')
    }
    this.handlers.set(code, handler)
    return this
  }

  handle(error, context = {}) {
    try {
      const code = error.code || 'UNKNOWN'
      const handler = this.handlers.get(code)

      if (handler) {
        const result = handler(error, context)
        logger.info('Error handled', { code, ...context })
        return { handled: true, error, result }
      }

      return { handled: false, error }
    } catch (err) {
      logger.error('Error handler failed', { error: err.message })
      return { handled: false, error, handlerError: err }
    }
  }

  isCritical(type) {
    return this.criticalPatterns.has(type)
  }

  getErrors(filter = {}) {
    return this.errors.filter(e => {
      if (filter.level && e.level !== filter.level) return false
      if (filter.side && e.side !== filter.side) return false
      if (filter.code && e.code !== filter.code) return false
      if (filter.type && e.type !== filter.type) return false
      return true
    })
  }

  getStats() {
    return {
      total: this.errorStats.total,
      byType: this.errorStats.byType,
      byLevel: this.errorStats.byLevel,
      recentErrors: this.errors.slice(-10).map(e => ({
        message: e.message,
        code: e.code,
        timestamp: e.timestamp
      }))
    }
  }

  clear() {
    this.errors = []
    this.errorStats = { total: 0, byType: {}, byLevel: {} }
  }

  addListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function')
    }
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  removeListener(listener) {
    this.listeners.delete(listener)
  }

  updateStats(errorEntry) {
    this.errorStats.total++
    this.errorStats.byType[errorEntry.type] = (this.errorStats.byType[errorEntry.type] || 0) + 1
    this.errorStats.byLevel[errorEntry.level] = (this.errorStats.byLevel[errorEntry.level] || 0) + 1
  }

  notifyListeners(errorEntry) {
    for (const listener of this.listeners) {
      try {
        listener(errorEntry)
      } catch (err) {
        logger.error('Error listener failed', { error: err.message })
      }
    }
  }

  destroy() {
    this.listeners.clear()
    this.handlers.clear()
    this.clear()
    super.destroy()
  }
}
