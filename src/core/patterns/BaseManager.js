// Base manager pattern for common initialization and lifecycle patterns
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
      this.logger.info(`${this.name} initialized`)
      this.initialized = true
    } catch (err) {
      this.logger.error(`Failed to initialize`, { error: err.message })
      throw err
    }
  }

  async destroy() {
    try {
      this.cleanupResources()
      this.initialized = false
      this.logger.info(`${this.name} destroyed`)
    } catch (err) {
      this.logger.error(`Failed to destroy`, { error: err.message })
    }
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
