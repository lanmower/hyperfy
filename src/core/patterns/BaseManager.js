// Base manager pattern with template method for initialization and lifecycle
import { StructuredLogger } from '../utils/logging/index.js'
import { UnifiedEventEmitter } from './UnifiedEventEmitter.js'

export class BaseManager {
  constructor(world, name) {
    this.world = world
    this.name = name
    this.logger = new StructuredLogger(name)
    this.emitter = new UnifiedEventEmitter(name)
    this.initialized = false
    this._resources = []
  }

  async init() {
    try {
      this.logger.info(`Initializing ${this.name}`)
      await this.initInternal()
      this.initialized = true
      this.logger.info(`${this.name} initialized`)
    } catch (err) {
      this.logger.error(`Failed to initialize`, { error: err.message })
      throw err
    }
  }

  async initInternal() {
  }

  async destroy() {
    try {
      await this.destroyInternal()
      this.cleanupResources()
      this.initialized = false
      this.logger.info(`${this.name} destroyed`)
    } catch (err) {
      this.logger.error(`Failed to destroy`, { error: err.message })
    }
  }

  async destroyInternal() {
  }

  registerResource(resource) {
    if (resource && typeof resource.dispose === 'function') {
      this._resources.push(resource)
    }
  }

  cleanupResources() {
    for (const resource of this._resources) {
      try {
        resource.dispose?.()
      } catch (err) {
        this.logger.warn(`Failed to dispose resource`, { error: err.message })
      }
    }
    this._resources = []
  }

  assertInitialized() {
    if (!this.initialized) {
      throw new Error(`${this.name} not initialized`)
    }
  }

  emit(eventName, ...args) {
    return this.emitter.emit(eventName, ...args)
  }

  on(eventName, handler, options = {}) {
    return this.emitter.on(eventName, handler, options)
  }

  once(eventName, handler, options = {}) {
    return this.emitter.once(eventName, handler, options)
  }

  off(eventName, handler) {
    return this.emitter.off(eventName, handler)
  }

  getResources() {
    return this._resources
  }
}
