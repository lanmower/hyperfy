import { System } from './System.js'
import { StateManager } from '../state/StateManager.js'
import { ErrorEventBus } from '../utils/ErrorEventBus.js'
import { ErrorLevels, ErrorSources } from '../schemas/ErrorEvent.schema.js'
import { ErrorCapture } from './monitors/ErrorCapture.js'
import { ErrorForwarder } from './monitors/ErrorForwarder.js'
import { ErrorAnalytics } from './monitors/ErrorAnalytics.js'
import { GlobalErrorInterceptor } from './monitors/GlobalErrorInterceptor.js'
import { ServerErrorReporter } from './monitors/ServerErrorReporter.js'

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
    this.interceptor = new GlobalErrorInterceptor(this)
    this.reporter = new ServerErrorReporter(this)

    this.setupErrorBusForwarding()
    this.interceptor.setup()
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
    this.reporter?.reportError(errorEvent, errorData)
  }

  getServerErrorReport = () => {
    if (!this.isServer) return null
    return this.reporter?.getReport()
  }

  captureClientError = (clientId, error) => {
    this.reporter?.captureClientError(clientId, error)
  }

  checkAlertThresholds = () => {
    this.reporter?.checkAlertThresholds()
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