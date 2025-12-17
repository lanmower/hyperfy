/**
 * Factory Registry
 *
 * Provides a generic registry for dynamically creating objects of different types.
 * Enables loose coupling between object creators and the rest of the system.
 *
 * Usage:
 *   const registry = new FactoryRegistry()
 *   registry.register('player', (data) => new Player(data))
 *   registry.register('enemy', (data) => new Enemy(data))
 *
 *   const player = registry.create('player', { name: 'John' })
 *   const enemy = registry.create('enemy', { hp: 100 })
 */

export class FactoryRegistry {
  constructor(options = {}) {
    this.factories = new Map()
    this.middleware = []
    this.options = options
  }

  /**
   * Register a factory function
   * @param {string} type - Type identifier
   * @param {Function} factory - Factory function: (data) => object
   * @returns {FactoryRegistry} For chaining
   */
  register(type, factory) {
    if (typeof factory !== 'function') {
      throw new TypeError(`Factory for '${type}' must be a function`)
    }
    this.factories.set(type, factory)
    return this
  }

  /**
   * Register multiple factories
   * @param {Object} map - Map of { type: factory }
   * @returns {FactoryRegistry} For chaining
   */
  registerBulk(map) {
    for (const [type, factory] of Object.entries(map)) {
      this.register(type, factory)
    }
    return this
  }

  /**
   * Unregister a factory
   * @param {string} type - Type identifier
   * @returns {FactoryRegistry} For chaining
   */
  unregister(type) {
    this.factories.delete(type)
    return this
  }

  /**
   * Create an object using registered factory
   * @param {string} type - Type identifier
   * @param {...any} args - Arguments to pass to factory
   * @returns {any} Created object
   */
  create(type, ...args) {
    const factory = this.factories.get(type)
    if (!factory) {
      throw new Error(`No factory registered for type: '${type}'`)
    }

    let result = factory(...args)

    for (const mw of this.middleware) {
      result = mw(result, type, args) || result
    }

    return result
  }

  /**
   * Create asynchronously
   * @param {string} type - Type identifier
   * @param {...any} args - Arguments to pass to factory
   * @returns {Promise<any>} Created object promise
   */
  async createAsync(type, ...args) {
    const factory = this.factories.get(type)
    if (!factory) {
      throw new Error(`No factory registered for type: '${type}'`)
    }

    let result = await factory(...args)

    for (const mw of this.middleware) {
      result = (await mw(result, type, args)) || result
    }

    return result
  }

  /**
   * Add middleware to process created objects
   * @param {Function} middleware - (obj, type, args) => obj
   * @returns {FactoryRegistry} For chaining
   */
  use(middleware) {
    this.middleware.push(middleware)
    return this
  }

  /**
   * Check if a type is registered
   * @param {string} type - Type identifier
   * @returns {boolean} True if type exists
   */
  has(type) {
    return this.factories.has(type)
  }

  /**
   * Get all registered types
   * @returns {string[]} Array of type names
   */
  types() {
    return Array.from(this.factories.keys())
  }

  /**
   * Clear all factories
   * @returns {FactoryRegistry} For chaining
   */
  clear() {
    this.factories.clear()
    return this
  }

  /**
   * Get factory count
   * @returns {number} Number of registered factories
   */
  size() {
    return this.factories.size
  }

  /**
   * Clone the registry
   * @returns {FactoryRegistry} New registry with same factories
   */
  clone() {
    const clone = new FactoryRegistry(this.options)
    for (const [type, factory] of this.factories) {
      clone.register(type, factory)
    }
    for (const mw of this.middleware) {
      clone.use(mw)
    }
    return clone
  }
}

/**
 * Singleton factory registry for globally shared factories
 */
export const globalFactoryRegistry = new FactoryRegistry()
