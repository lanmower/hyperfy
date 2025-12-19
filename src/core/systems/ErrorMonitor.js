import { System } from './System.js'
import { StateManager } from '../state/StateManager.js'
import { ErrorEventBus } from '../utils/ErrorEventBus.js'
import { ErrorLevels, ErrorSources } from '../schemas/ErrorEvent.schema.js'
import { errorObserver } from '../../server/services/ErrorObserver.js'
import { errorFormatter } from '../../server/utils/ErrorFormatter.js'
import { ErrorCapture } from './monitors/ErrorCapture.js'
import { ErrorForwarder } from './monitors/ErrorForwarder.js'
import { ErrorAnalytics } from './monitors/ErrorAnalytics.js'

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

    this.capture = new ErrorCapture(this)
    this.forwarder = new ErrorForwarder(this)
    this.analytics = new ErrorAnalytics(this)

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
    return this.capture.captureError(type, args, stack)
  }

  isCriticalError(type, args) {
    return this.capture.isCriticalError(type, args)
  }

  forwardErrorEvent(event, isDuplicate) {
    return this.forwarder.forwardErrorEvent(event, isDuplicate)
  }

  handleCriticalError(errorEntry) {
    return this.forwarder.handleCriticalError(errorEntry)
  }

  onErrorReport = (socket, errorData) => {
    if (!this.isServer) return

    try {
      const { deserializeErrorEvent } = require('../schemas/ErrorEvent.schema.js')
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
      const { deserializeErrorEvent } = require('../schemas/ErrorEvent.schema.js')
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

  getErrors(options = {}) {
    return this.analytics.getErrors(options)
  }

  clearErrors() {
    return this.analytics.clearErrors()
  }

  getStats() {
    return this.analytics.getStats()
  }

  cleanup() {
    return this.analytics.cleanup()
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