import { System } from './System.js'
import { StateManager } from '../state/StateManager.js'
import { ErrorEventBus } from '../utils/ErrorEventBus.js'
import { ErrorLevels } from '../schemas/ErrorEvent.schema.js'
import { ErrorCapture } from './errors/ErrorCapture.js'
import { ErrorQuery } from './errors/ErrorQuery.js'
import { ErrorReporter } from './errors/ErrorReporter.js'

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
    this.errorCapture = new ErrorCapture(this)
    this.errorQuery = new ErrorQuery(this)
    this.errorReporter = new ErrorReporter(this)

    this.setupErrorBusForwarding()
    this.errorCapture.interceptGlobalErrors()
    setInterval(() => this.errorQuery.cleanup(), 60000)
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
    return this.errorReporter.forwardErrorEvent(event, isDuplicate)
  }

  captureError(type, args, stack) {
    return this.errorCapture.captureError(type, args, stack)
  }

  isCriticalError(type, args) {
    return this.errorCapture.isCriticalError(type, args)
  }

  sendErrorToServer(errorEntry) {
    return this.errorReporter.sendErrorToServer(errorEntry)
  }

  handleCriticalError(errorEntry) {
    return this.errorReporter.handleCriticalError(errorEntry)
  }

  streamToMCP(errorEntry) {
    return this.errorReporter.streamToMCP(errorEntry)
  }

  getErrors(options = {}) {
    return this.errorQuery.getErrors(options)
  }

  clearErrors() {
    return this.errorQuery.clearErrors()
  }

  getStats() {
    return this.errorQuery.getStats()
  }

  cleanup() {
    return this.errorQuery.cleanup()
  }


  onErrorReport = (socket, errorData) => {
    return this.errorReporter.onErrorReport(socket, errorData)
  }

  receiveClientError = (errorData) => {
    return this.errorReporter.receiveClientError(errorData)
  }

  reportServerError = (errorEvent, errorData) => {
    return this.errorReporter.reportServerError(errorEvent, errorData)
  }

  getServerErrorReport = () => {
    return this.errorReporter.getServerErrorReport()
  }

  captureClientError = (clientId, error) => {
    return this.errorReporter.captureClientError(clientId, error)
  }

  checkAlertThresholds = () => {
    return this.errorReporter.checkAlertThresholds()
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