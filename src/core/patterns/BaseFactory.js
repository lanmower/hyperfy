// Base factory pattern supporting static creation, validation, and pooling
import { StructuredLogger } from '../utils/logging/index.js'
import { ObjectPool } from '../utils/pool/ObjectPool.js'

export class BaseFactory {
  static pools = new Map()
  static logger = new StructuredLogger('BaseFactory')

  static create(config) {
    throw new Error('Factory.create(config) must be implemented')
  }

  static validate(config) {
    if (!config || typeof config !== 'object') {
      throw new Error(`Factory.validate: config must be an object, got ${typeof config}`)
    }
    return true
  }

  static createBatch(configs = []) {
    if (!Array.isArray(configs)) {
      throw new Error(`Factory.createBatch: configs must be an array`)
    }
    return configs.map(cfg => this.create(cfg))
  }

  static pool(name = 'default', factory = () => ({}), reset = null) {
    const key = `${this.name}_${name}`
    if (!this.pools.has(key)) {
      this.pools.set(key, new ObjectPool(factory, reset))
    }
    return this.pools.get(key)
  }

  static resetPool(name = 'default') {
    const key = `${this.name}_${name}`
    if (this.pools.has(key)) {
      this.pools.get(key).reset()
    }
  }
}
