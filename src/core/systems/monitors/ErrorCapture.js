import { ErrorLevels, ErrorSources } from '../../schemas/ErrorEvent.schema.js'
import { ErrorPatterns } from '../../utils/validation/errorPatterns.js'
import { Serialization } from '../../utils/serialization.js'

export class ErrorCapture {
  constructor(errorMonitor) {
    this.errorMonitor = errorMonitor
    this.errorBus = errorMonitor.errorBus
  }

  captureError(type, args, stack) {
    const error = {
      message: this.extractMessage(args),
      stack: this.cleanStack(stack)
    }

    const context = {
      category: type,
      source: this.errorMonitor.isClient ? ErrorSources.CLIENT : ErrorSources.SERVER,
      ...this.getContext()
    }

    const level = this.isCriticalError(type, args) ? ErrorLevels.ERROR : ErrorLevels.WARN

    this.errorBus.emit(error, context, level)

    const errorId = this.errorMonitor.state.get('errorId') + 1
    this.errorMonitor.state.set('errorId', errorId)
  }

  extractMessage(args) {
    if (typeof args === 'string') return args
    if (args?.message) return String(args.message)
    if (Array.isArray(args)) return args.join(' ')
    return JSON.stringify(args)
  }

  cleanStack(stack) {
    return Serialization.cleanStack(stack)
  }

  getContext() {
    const context = {
      timestamp: Date.now(),
      url: this.errorMonitor.isClient ? window.location?.href : null,
      userAgent: this.errorMonitor.isClient ? navigator?.userAgent : null,
      memory: this.getMemoryUsage(),
      entities: this.errorMonitor.entities?.count || 0,
      blueprints: this.errorMonitor.blueprints?.count || 0
    }

    if (typeof performance !== 'undefined') {
      context.performance = {
        now: performance.now(),
        memory: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : null
      }
    }

    return context
  }

  getMemoryUsage() {
    if (this.errorMonitor.isServer && typeof process !== 'undefined') {
      const usage = process.memoryUsage()
      return {
        rss: usage.rss,
        heapTotal: usage.heapTotal,
        heapUsed: usage.heapUsed,
        external: usage.external
      }
    }

    if (this.errorMonitor.isClient && typeof performance !== 'undefined' && performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      }
    }

    return null
  }

  isCriticalError(type, args) {
    let message = ''
    if (Array.isArray(args)) {
      message = args.join(' ')
    } else if (args && typeof args === 'string') {
      message = args
    } else if (args && typeof args === 'object') {
      message = JSON.stringify(args)
    } else {
      message = String(args || '')
    }
    return ErrorPatterns.isCritical(type, message)
  }
}
