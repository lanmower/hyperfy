import { System } from './System.js'
import { ErrorPatterns } from '../utils/errorPatterns.js'
import { Serialization } from '../utils/serialization.js'
import { ListenerMixin } from '../mixins/ListenerMixin.js'

export class ErrorMonitor extends ListenerMixin(System) {
  constructor(world) {
    super(world)
    this.isClient = !world.isServer
    this.isServer = world.isServer
    this.errors = []
    this.maxErrors = 500
    this.errorId = 0

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
    const errorEntry = {
      id: ++this.errorId,
      timestamp: new Date().toISOString(),
      type,
      side: this.isClient ? 'client' : 'server',
      args: this.serializeArgs(args),
      stack: this.cleanStack(stack),
      context: this.getContext(),
      networkId: this.world.network?.id,
      playerId: this.world.entities?.player?.data?.id
    }

    this.errors.push(errorEntry)

    // Maintain max size
    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }

    // Notify listeners
    this.notifyListeners('error', errorEntry)

    // CRITICAL FIX: Send ALL client errors to server via WebSocket immediately
    if (this.isClient && this.world.network) {
      this.sendErrorToServer(errorEntry)
    }

    // Legacy HTTP streaming (keeping for backward compatibility)
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
    this.notifyListeners('critical', errorEntry)

    // Critical errors get additional handling but all errors are already sent via sendErrorToServer
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

    let filtered = this.errors

    if (type) {
      filtered = filtered.filter(error => error.type === type)
    }

    if (since) {
      const sinceTime = new Date(since).getTime()
      filtered = filtered.filter(error => new Date(error.timestamp).getTime() >= sinceTime)
    }

    if (side) {
      filtered = filtered.filter(error => error.side === side)
    }

    if (critical !== null) {
      filtered = filtered.filter(error => this.isCriticalError(error.type, error.args) === critical)
    }

    return filtered
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)
  }

  clearErrors() {
    const count = this.errors.length
    this.errors = []
    this.errorId = 0
    return count
  }

  getStats() {
    const now = Date.now()
    const hourAgo = now - (60 * 60 * 1000)
    const recent = this.errors.filter(error => 
      new Date(error.timestamp).getTime() >= hourAgo
    )

    const byType = {}
    recent.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1
    })

    return {
      total: this.errors.length,
      recent: recent.length,
      critical: recent.filter(error => 
        this.isCriticalError(error.type, error.args)
      ).length,
      byType
    }
  }

  cleanup() {
    // Remove very old errors to prevent memory leaks
    const cutoff = Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago
    this.errors = this.errors.filter(error => 
      new Date(error.timestamp).getTime() >= cutoff
    )
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

    this.errors.push(error)
    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }

    // CRITICAL FIX: Forward ALL client errors to MCP subscribers immediately
    this.notifyListeners('error', error)

    if (this.isCriticalError(error.type, error.args) || errorData.critical) {
      this.notifyListeners('critical', error)
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

    this.errors.push(error)
    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }

    // Notify listeners for real-time error streaming - this sends to MCP subscribers
    this.notifyListeners('error', error)

    if (this.isCriticalError(error.type, error.args) || errorData.critical) {
      this.notifyListeners('critical', error)
    }
  }

  destroy() {
    this.errors = []
    super.destroy()
  }
}