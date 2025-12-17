import { ErrorPatterns } from '../../utils/errorPatterns.js'
import { Serialization } from '../../utils/serialization.js'
import { ErrorLevels, ErrorSources } from '../../schemas/ErrorEvent.schema.js'

export class ErrorCapture {
  constructor(errorMonitor) {
    this.monitor = errorMonitor
  }

  interceptGlobalErrors() {
    if (this.monitor.isClient && typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.captureError('window.error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        }, event.error?.stack)
      })

      window.addEventListener('unhandledrejection', (event) => {
        this.captureError('unhandled.promise.rejection', {
          reason: event.reason,
          promise: event.promise
        }, event.reason?.stack)
      })
    }

    if (this.monitor.isServer && typeof process !== 'undefined') {
      process.on('uncaughtException', (error) => {
        this.captureError('uncaught.exception', {
          message: error.message,
          name: error.name
        }, error.stack)
      })

      process.on('unhandledRejection', (reason, promise) => {
        this.captureError('unhandled.promise.rejection', {
          reason: reason,
          promise: promise
        }, reason?.stack)
      })
    }
  }

  captureError(type, args, stack) {
    const error = {
      message: this.extractMessage(args),
      stack: this.cleanStack(stack)
    }

    const context = {
      category: type,
      source: this.monitor.isClient ? ErrorSources.CLIENT : ErrorSources.SERVER,
      ...this.getContext()
    }

    const level = this.isCriticalError(type, args) ? ErrorLevels.ERROR : ErrorLevels.WARN

    this.monitor.errorBus.emit(error, context, level)

    const errorId = this.monitor.state.get('errorId') + 1
    this.monitor.state.set('errorId', errorId)
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
      url: this.monitor.isClient ? window.location?.href : null,
      userAgent: this.monitor.isClient ? navigator?.userAgent : null,
      memory: this.getMemoryUsage(),
      entities: this.monitor.entities?.count || 0,
      blueprints: this.monitor.blueprints?.count || 0
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
    if (this.monitor.isServer && typeof process !== 'undefined') {
      const usage = process.memoryUsage()
      return {
        rss: usage.rss,
        heapTotal: usage.heapTotal,
        heapUsed: usage.heapUsed,
        external: usage.external
      }
    }

    if (this.monitor.isClient && typeof performance !== 'undefined' && performance.memory) {
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
