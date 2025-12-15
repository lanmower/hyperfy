import { System } from './System.js'
import { ErrorPatterns } from '../utils/errorPatterns.js'
import { Serialization } from '../utils/serialization.js'
import { StateManager } from '../state/StateManager.js'

export class ErrorMonitor extends System {
  constructor(world) {
    super(world)
    this.isClient = !world.isServer
    this.isServer = world.isServer
    this.state = new StateManager({ errors: [], errorId: 0 })
    this.maxErrors = 500

    this.interceptGlobalErrors()
    setInterval(() => this.cleanup(), 60000)
  }

  init(options = {}) {
    this.mcpEndpoint = options.mcpEndpoint || null
    this.enableRealTimeStreaming = options.enableRealTimeStreaming !== false
    this.debugMode = options.debugMode === true
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
    const errorId = this.state.get('errorId') + 1
    this.state.set('errorId', errorId)

    const errorEntry = {
      id: errorId,
      timestamp: new Date().toISOString(),
      type,
      side: this.isClient ? 'client' : 'server',
      args: this.serializeArgs(args),
      stack: this.cleanStack(stack),
      context: this.getContext(),
      networkId: this.world.network?.id,
      playerId: this.world.entities?.player?.data?.id
    }

    const errors = this.state.get('errors')
    const updated = [...errors, errorEntry]
    if (updated.length > this.maxErrors) updated.shift()
    this.state.set('errors', updated)

    this.world.events.emit('errorCaptured', errorEntry)

    if (this.isClient && this.world.network) {
      this.sendErrorToServer(errorEntry)
    }

    if (this.enableRealTimeStreaming && this.mcpEndpoint) {
      this.streamToMCP(errorEntry)
    }

    if (this.isCriticalError(type, args)) {
      this.handleCriticalError(errorEntry)
    }
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
    const now = Date.now()
    const hourAgo = now - (60 * 60 * 1000)
    const errors = this.state.get('errors')
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
      byType
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

    const error = {
      ...errorData.error,
      timestamp: new Date().toISOString(),
      side: 'client-reported',
      socketId: socket.id,
      realTime: errorData.realTime || false
    }

    const errors = this.state.get('errors')
    const updated = [...errors, error]
    if (updated.length > this.maxErrors) updated.shift()
    this.state.set('errors', updated)

    this.world.events.emit('errorCaptured', error)

    if (this.isCriticalError(error.type, error.args) || errorData.critical) {
      this.world.events.emit('criticalError', error)
    }
  }

  receiveClientError = (errorData) => {
    if (!this.isServer) return

    const error = {
      ...errorData.error || errorData,
      timestamp: new Date().toISOString(),
      side: 'client-reported',
      realTime: errorData.realTime || false
    }

    const errors = this.state.get('errors')
    const updated = [...errors, error]
    if (updated.length > this.maxErrors) updated.shift()
    this.state.set('errors', updated)

    this.world.events.emit('errorCaptured', error)

    if (this.isCriticalError(error.type, error.args) || errorData.critical) {
      this.world.events.emit('criticalError', error)
    }
  }

  destroy() {
    this.state.set('errors', [])
    super.destroy()
  }
}