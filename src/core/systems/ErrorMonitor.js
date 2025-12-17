import { System } from './System.js'
import { ErrorPatterns } from '../utils/errorPatterns.js'
import { Serialization } from '../utils/serialization.js'
import { StateManager } from '../state/StateManager.js'
import { ErrorEventBus } from '../utils/ErrorEventBus.js'
import { createErrorEvent, deserializeErrorEvent, ErrorLevels, ErrorSources } from '../schemas/ErrorEvent.schema.js'
import { errorObserver } from '../../server/services/ErrorObserver.js'
import { errorFormatter } from '../../server/utils/ErrorFormatter.js'
import { ErrorForwarder } from './errors/ErrorForwarder.js'

export class ErrorMonitor extends System {
  static DEPS = {
    network: 'network',
    entities: 'entities',
    events: 'events',
    blueprints: 'blueprints',
  }

  constructor(world) {
    super(world)
    this.isClient = !world.isServer
    this.isServer = world.isServer
    this.state = new StateManager({ errors: [], errorId: 0 })
    this.maxErrors = 500
    this.errorBus = new ErrorEventBus()
    this.listeners = new Set()

    this.setupErrorBusForwarding()
    this.interceptGlobalErrors()
    setInterval(() => this.cleanup(), 60000)
  }

  get network() { return this.getService(ErrorMonitor.DEPS.network) }
  get entities() { return this.getService(ErrorMonitor.DEPS.entities) }
  get events() { return this.getService(ErrorMonitor.DEPS.events) }
  get blueprints() { return this.getService(ErrorMonitor.DEPS.blueprints) }

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
      networkId: this.network?.id,
      playerId: this.entities?.player?.data?.id,
      level: event.level,
      count: event.count
    }

    const errors = this.state.get('errors')
    const updated = [...errors, errorEntry]
    if (updated.length > this.maxErrors) updated.shift()
    this.state.set('errors', updated)

    this.events.emit('errorCaptured', errorEntry)

    for (const listener of this.listeners) {
      try {
        listener('error', errorEntry)
      } catch (err) {
        console.error('Error in listener:', err)
      }
    }

    if (event.level === ErrorLevels.ERROR && !isDuplicate) {
      if (this.isClient && this.network) {
        this.sendErrorToServer(errorEntry)
      }

      if (this.enableRealTimeStreaming && this.mcpEndpoint) {
        this.streamToMCP(errorEntry)
      }
    }
  }

  interceptGlobalErrors() {
    if (this.isClient && typeof window !== 'undefined') {
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
      entities: this.entities?.count || 0,
      blueprints: this.blueprints?.count || 0
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
    try {
      this.network.send('errorReport', {
        error: errorEntry,
        realTime: true
      })
    } catch (err) {
    }
  }

  handleCriticalError(errorEntry) {
    this.events.emit('criticalError', errorEntry)

    if (this.isClient && this.network) {
      this.network.send('errorReport', {
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
        this.events.emit('criticalError', errorEvent)
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

      if (this.isServer && errorEvent.level === ErrorLevels.ERROR) {
        this.reportServerError(errorEvent, errorData)
      }

      if (errorEvent.level === ErrorLevels.ERROR || errorData.critical) {
        this.events.emit('criticalError', errorEvent)
      }
    } catch (err) {
      console.error('Failed to process client error:', err)
    }
  }

  reportServerError = (errorEvent, errorData) => {
    const metadata = {
      clientId: errorData.clientId,
      userId: errorData.userId,
      userName: errorData.userName,
      clientIP: errorData.clientIP
    }

    const formatted = errorFormatter.formatForStderr(errorEvent, metadata)
    process.stderr.write(formatted)
  }

  getServerErrorReport = () => {
    if (!this.isServer) return null

    const localStats = this.getStats()
    const observerStats = errorObserver.getErrorStats()

    return {
      local: localStats,
      client: observerStats,
      combined: {
        total: localStats.total + observerStats.total,
        lastMinute: localStats.recent + observerStats.lastMinute,
        critical: localStats.critical + observerStats.critical,
        byType: {
          ...localStats.byType,
          ...observerStats.byCategory
        }
      }
    }
  }

  captureClientError = (clientId, error) => {
    if (!this.isServer) return

    errorObserver.recordClientError(clientId, error, {
      timestamp: Date.now(),
      source: 'server-detected'
    })
  }

  checkAlertThresholds = () => {
    if (!this.isServer) return

    const stats = errorObserver.getErrorStats()

    if (stats.lastMinute >= 25) {
      const alert = errorFormatter.formatAlert(
        'High error rate detected across all clients',
        'CRITICAL'
      )
      process.stderr.write(alert)
    }

    if (stats.critical > 0) {
      const alert = errorFormatter.formatAlert(
        `${stats.critical} critical errors detected`,
        'CRITICAL'
      )
      process.stderr.write(alert)
    }
  }

  addListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function')
    }
    this.listeners.add(listener)
    return () => this.removeListener(listener)
  }

  removeListener(listener) {
    this.listeners.delete(listener)
  }

  destroy() {
    this.state.set('errors', [])
    this.listeners.clear()
    super.destroy()
  }
}