import { System } from './System.js'
import { ErrorPatterns } from '../utils/errorPatterns.js'
import { Serialization } from '../utils/serialization.js'
import { StateManager } from '../state/StateManager.js'
import { ErrorEventBus } from '../utils/ErrorEventBus.js'
import { createErrorEvent, deserializeErrorEvent, ErrorLevels, ErrorSources } from '../schemas/ErrorEvent.schema.js'

export class ErrorMonitor extends System {
  constructor(world) {
    super(world)
    this.isClient = !world.isServer
    this.isServer = world.isServer
    this.state = new StateManager({ errors: [], errorId: 0 })
    this.maxErrors = 500
    this.errorBus = new ErrorEventBus()

    this.setupErrorBusForwarding()
    this.interceptGlobalErrors()
    setInterval(() => this.cleanup(), 60000)
  }

  init(options = {}) {
    this.mcpEndpoint = options.mcpEndpoint || null
    this.enableRealTimeStreaming = options.enableRealTimeStreaming !== false
    this.debugMode = options.debugMode === true
  }

  setupErrorBusForwarding() {
    this.errorBus.register((event, isDuplicate) => {
      this.forwardErrorEvent(event, isDuplicate)
    })
  }

  forwardErrorEvent(event, isDuplicate) {
    const errorEntry = {
      id: event.id,
      timestamp: new Date(event.timestamp).toISOString(),
      type: event.category,
      side: event.source === ErrorSources.SDK ? 'client' : event.source,
      args: { message: event.message, context: event.context },
      stack: event.stack,
      context: event.context,
      networkId: this.world.network?.id,
      playerId: this.world.entities?.player?.data?.id,
      level: event.level,
      count: event.count
    }

    const errors = this.state.get('errors')
    const updated = [...errors, errorEntry]
    if (updated.length > this.maxErrors) updated.shift()
    this.state.set('errors', updated)

    this.world.events.emit('errorCaptured', errorEntry)

    if (event.level === ErrorLevels.ERROR && !isDuplicate) {
      if (this.isClient && this.world.network) {
        this.sendErrorToServer(errorEntry)
      }

      if (this.enableRealTimeStreaming && this.mcpEndpoint) {
        this.streamToMCP(errorEntry)
      }
    }
  }

  interceptGlobalErrors() {
    if (this.isClient && typeof window !== 'undefined') {
      // Client-side global error handlers
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

    if (this.isServer && typeof process !== 'undefined') {
      // Server-side global error handlers
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
      source: this.isClient ? ErrorSources.CLIENT : ErrorSources.SERVER,
      ...this.getContext()
    }

    const level = this.isCriticalError(type, args) ? ErrorLevels.ERROR : ErrorLevels.WARN

    this.errorBus.emit(error, context, level)

    const errorId = this.state.get('errorId') + 1
    this.state.set('errorId', errorId)
  }

  extractMessage(args) {
    if (typeof args === 'string') return args
    if (args?.message) return String(args.message)
    if (Array.isArray(args)) return args.join(' ')
    return JSON.stringify(args)
  }

  serializeArgs(args) {
    return Serialization.serializeArgs(args)
  }

  cleanStack(stack) {
    return Serialization.cleanStack(stack)
  }

  getStackTrace() {
    try {
      throw new Error()
    } catch (error) {
      return error.stack
    }
  }

  getContext() {
    const context = {
      timestamp: Date.now(),
      url: this.isClient ? window.location?.href : null,
      userAgent: this.isClient ? navigator?.userAgent : null,
      memory: this.getMemoryUsage(),
      entities: this.world.entities?.count || 0,
      blueprints: this.world.blueprints?.count || 0
    }

    // Add performance context if available
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
    if (this.isServer && typeof process !== 'undefined') {
      const usage = process.memoryUsage()
      return {
        rss: usage.rss,
        heapTotal: usage.heapTotal,
        heapUsed: usage.heapUsed,
        external: usage.external
      }
    }

    if (this.isClient && typeof performance !== 'undefined' && performance.memory) {
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

  sendErrorToServer(errorEntry) {
    // Send errors to game server via WebSocket for MCP relay
    try {
      this.world.network.send('errorReport', {
        error: errorEntry,
        realTime: true
      })
    } catch (err) {
      // Silently fail if network send fails to avoid error loops
    }
  }

  handleCriticalError(errorEntry) {
    this.world.events.emit('criticalError', errorEntry)

    if (this.isClient && this.world.network) {
      this.world.network.send('errorReport', {
        critical: true,
        error: errorEntry
      })
    }
  }

  streamToMCP(errorEntry) {
    if (typeof fetch !== 'undefined') {
      fetch(this.mcpEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'error',
          data: errorEntry
        })
      }).catch(() => {
      })
    }
  }


  getErrors(options = {}) {
    const {
      limit = 50,
      type = null,
      since = null,
      side = null,
      critical = null
    } = options

    let filtered = this.state.get('errors')

    if (type) filtered = filtered.filter(error => error.type === type)
    if (since) {
      const sinceTime = new Date(since).getTime()
      filtered = filtered.filter(error => new Date(error.timestamp).getTime() >= sinceTime)
    }
    if (side) filtered = filtered.filter(error => error.side === side)
    if (critical !== null) {
      filtered = filtered.filter(error => this.isCriticalError(error.type, error.args) === critical)
    }

    return filtered
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)
  }

  clearErrors() {
    const count = this.state.get('errors').length
    this.state.set('errors', [])
    this.state.set('errorId', 0)
    return count
  }

  getStats() {
    const busStats = this.errorBus.getStats()
    const errors = this.state.get('errors')

    const now = Date.now()
    const hourAgo = now - (60 * 60 * 1000)
    const recent = errors.filter(error =>
      new Date(error.timestamp).getTime() >= hourAgo
    )

    const byType = {}
    recent.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1
    })

    return {
      total: errors.length,
      recent: recent.length,
      critical: recent.filter(error =>
        this.isCriticalError(error.type, error.args)
      ).length,
      byType,
      unified: busStats
    }
  }

  cleanup() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000)
    const errors = this.state.get('errors')
    const cleaned = errors.filter(error =>
      new Date(error.timestamp).getTime() >= cutoff
    )
    this.state.set('errors', cleaned)
  }


  onErrorReport = (socket, errorData) => {
    if (!this.isServer) return

    try {
      const errorEvent = deserializeErrorEvent(errorData.error || errorData)
      errorEvent.source = ErrorSources.CLIENT
      errorEvent.metadata = {
        ...errorEvent.metadata,
        socketId: socket.id,
        realTime: errorData.realTime || false
      }

      this.errorBus.emit(
        { message: errorEvent.message, stack: errorEvent.stack },
        {
          ...errorEvent.context,
          category: errorEvent.category,
          source: errorEvent.source,
          metadata: errorEvent.metadata
        },
        errorEvent.level
      )

      if (errorEvent.level === ErrorLevels.ERROR || errorData.critical) {
        this.world.events.emit('criticalError', errorEvent)
      }
    } catch (err) {
      console.error('Failed to process client error report:', err)
    }
  }

  receiveClientError = (errorData) => {
    if (!this.isServer) return

    try {
      const errorEvent = deserializeErrorEvent(errorData.error || errorData)
      errorEvent.source = ErrorSources.CLIENT
      errorEvent.metadata = {
        ...errorEvent.metadata,
        realTime: errorData.realTime || false
      }

      this.errorBus.emit(
        { message: errorEvent.message, stack: errorEvent.stack },
        {
          ...errorEvent.context,
          category: errorEvent.category,
          source: errorEvent.source,
          metadata: errorEvent.metadata
        },
        errorEvent.level
      )

      if (errorEvent.level === ErrorLevels.ERROR || errorData.critical) {
        this.world.events.emit('criticalError', errorEvent)
      }
    } catch (err) {
      console.error('Failed to process client error:', err)
    }
  }

  destroy() {
    this.state.set('errors', [])
    super.destroy()
  }
}