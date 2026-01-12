// Centralized factory registry for unified creation patterns
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('FactoryRegistry')

export class FactoryRegistry {
  static #factories = new Map()

  static register(name, Factory) {
    if (!name || typeof name !== 'string') {
      throw new Error('Factory name must be a non-empty string')
    }
    if (!Factory || typeof Factory.create !== 'function') {
      throw new Error(`Factory must implement static create(config) method`)
    }
    this.#factories.set(name, Factory)
    logger.debug('Factory registered', { name })
  }

  static get(name) {
    if (!this.#factories.has(name)) {
      throw new Error(`Factory not registered: ${name}`)
    }
    return this.#factories.get(name)
  }

  static create(name, config) {
    const Factory = this.get(name)
    if (Factory.validate) {
      Factory.validate(config)
    }
    return Factory.create(config)
  }

  static createBatch(name, configs) {
    const Factory = this.get(name)
    if (!Array.isArray(configs)) {
      throw new Error(`createBatch requires array of configs`)
    }
    return Factory.createBatch ? Factory.createBatch(configs) : configs.map(cfg => Factory.create(cfg))
  }

  static has(name) {
    return this.#factories.has(name)
  }

  static list() {
    return Array.from(this.#factories.keys())
  }

  static clear() {
    this.#factories.clear()
  }
}
