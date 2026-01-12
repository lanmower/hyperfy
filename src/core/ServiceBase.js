
import { UnifiedEventEmitter } from './patterns/UnifiedEventEmitter.js'

export class ServiceBase {
  constructor(name = 'Service') {
    this.name = name
    this.isInitialized = false
    this.events = new UnifiedEventEmitter(name)
    this.config = {}
    this.metadata = {}
  }

  init(config = {}) {
    this.config = { ...this.config, ...config }
    this.isInitialized = true
    this.events.emit('initialized', config)
    return this
  }

  configure(config) {
    this.config = { ...this.config, ...config }
    this.events.emit('configured', config)
    return this
  }

  setMetadata(key, value) {
    this.metadata[key] = value
    return this
  }

  getMetadata(key) {
    return this.metadata[key]
  }

  on(event, callback) {
    return this.events.on(event, callback)
  }

  once(event, callback) {
    return this.events.once(event, callback)
  }

  off(event, callback) {
    this.events.off(event, callback)
    return this
  }

  emit(event, ...args) {
    this.events.emit(event, ...args)
    return this
  }

  async start() {
    this.events.emit('started')
    return this
  }

  async stop() {
    this.events.emit('stopped')
    return this
  }

  async reset() {
    this.events.clear()
    this.metadata = {}
    this.events.emit('reset')
    return this
  }

  async destroy() {
    await this.stop()
    this.events.clear()
    this.isInitialized = false
    this.events.emit('destroyed')
  }

  get isRunning() {
    return this.isInitialized
  }

  toString() {
    return `${this.name}(initialized=${this.isInitialized})`
  }
}
