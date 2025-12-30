// Base manager pattern with template method for initialization and lifecycle
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

export class BaseManager {
  constructor(world, name) {
    this.world = world
    this.name = name
    this.logger = new ComponentLogger(name)
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
}
