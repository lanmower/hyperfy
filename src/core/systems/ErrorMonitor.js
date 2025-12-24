import { System } from './System.js'
import { StateManager } from '../state/StateManager.js'
import { ErrorEventBus } from '../utils/ErrorEventBus.js'
import { ErrorLevels, ErrorSources } from '../schemas/ErrorEvent.schema.js'
import { ErrorHandlerRegistry } from './monitors/ErrorHandlerRegistry.js'
import { ErrorCapture } from './monitors/ErrorCapture.js'
import { ErrorForwarder } from './monitors/ErrorForwarder.js'
import { ErrorAnalytics } from './monitors/ErrorAnalytics.js'
import { GlobalErrorInterceptor } from './monitors/GlobalErrorInterceptor.js'
import { ClientErrorReporter } from './monitors/ClientErrorReporter.js'

let ServerErrorReporter = null
let isServerEnv = typeof process !== 'undefined' && process.versions?.node

async function loadServerReporter() {
  if (isServerEnv && !ServerErrorReporter) {
    try {
      const mod = await import('./monitors/ServerErrorReporter.js')
      ServerErrorReporter = mod.ServerErrorReporter
    } catch (e) {
      // Silently ignore if not available
    }
  }
}

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
    this.listeners = new Set()

    this.errorBus = new ErrorEventBus()
    this.registry = new ErrorHandlerRegistry()

    this.capture = new ErrorCapture(this)
    this.forwarder = new ErrorForwarder(this)
    this.analytics = new ErrorAnalytics(this)
    this.interceptor = new GlobalErrorInterceptor(this)
    this.clientReporter = this.isClient ? new ClientErrorReporter(this) : null
    this.reporter = null

    loadServerReporter()
    if (this.isServer && ServerErrorReporter) {
      this.reporter = new ServerErrorReporter(this)
    }

    this.registry.register('capture', this.capture)
    this.registry.register('forwarder', this.forwarder)

    this.errorBus.register((event, isDuplicate) => {
      this.registry.route(event, isDuplicate)
    })

    // Defer interceptor setup to allow World to fully initialize
    setTimeout(() => this.interceptor.setup(), 100)
    setInterval(() => this.analytics.cleanup(), 60000)
  }

  init(options = {}) {
    this.mcpEndpoint = options.mcpEndpoint || null
    this.enableRealTimeStreaming = options.enableRealTimeStreaming !== false
    this.debugMode = options.debugMode === true
    if (this.clientReporter && this.network) {
      this.clientReporter.init(this.network)
    }
  }

  captureError(type, args, stack) {
    this.capture.captureError(type, args, stack)
    if (this.clientReporter && this.isClient) {
      this.clientReporter.reportError({ type, args, stack })
    }
  }

  isCriticalError(type, args) {
    return this.capture.isCriticalError(type, args)
  }

  onErrorReport = (socket, errorData) => {
    if (!this.isServer) return
    this.processErrorData(errorData, { socketId: socket.id })
  }

  receiveClientError = (errorData) => {
    if (!this.isServer) return
    this.processErrorData(errorData)
    if (errorData.error?.level === ErrorLevels.ERROR && this.reporter) {
      this.reporter.reportError(errorData.error, errorData)
    }
  }

  processErrorData(errorData, metadata = {}) {
    try {
      const { deserializeErrorEvent } = require('../schemas/ErrorEvent.schema.js')
      const errorEvent = deserializeErrorEvent(errorData.error || errorData)
      errorEvent.source = ErrorSources.CLIENT
      errorEvent.metadata = { ...errorEvent.metadata, ...metadata }

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
      console.error('Failed to process error data:', err)
    }
  }

  getErrors(options) {
    return this.analytics.getErrors(options)
  }

  clearErrors() {
    return this.analytics.clearErrors()
  }

  getStats() {
    return this.analytics.getStats()
  }

  getServerErrorReport() {
    return this.isServer && this.reporter ? this.reporter.getReport() : null
  }

  captureClientError(clientId, error) {
    this.reporter?.captureClientError(clientId, error)
  }

  checkAlertThresholds() {
    this.reporter?.checkAlertThresholds()
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

  destroy() {
    this.state.set('errors', [])
    this.listeners.clear()
    this.registry.clear()
    super.destroy()
  }
}
