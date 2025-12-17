/**
 * Service Container
 *
 * A lightweight dependency injection container for managing services and their dependencies.
 * Supports singleton and factory patterns.
 *
 * Usage:
 * ```
 * const container = new ServiceContainer()
 * container.register('logger', () => new Logger())
 * container.register('database', (c) => new Database(c.get('logger')))
 * const logger = container.get('logger')
 * ```
 */
export class ServiceContainer {
  constructor() {
    this.services = new Map()
    this.instances = new Map()
    this.factories = new Map()
  }

  /**
   * Register a service with a factory function
   * @param {string} name - Service name
   * @param {Function} factory - Factory function that takes container as argument
   * @param {boolean} singleton - If true, instance is cached (default: true)
   */
  register(name, factory, singleton = true) {
    if (typeof factory !== 'function') {
      throw new Error(`Factory for service '${name}' must be a function`)
    }
    this.services.set(name, { factory, singleton })
    return this
  }

  /**
   * Register a singleton instance
   * @param {string} name - Service name
   * @param {any} instance - Service instance
   */
  registerSingleton(name, instance) {
    this.instances.set(name, instance)
    this.services.set(name, { singleton: true })
    return this
  }

  /**
   * Get a service instance
   * @param {string} name - Service name
   * @returns {any} Service instance
   */
  get(name) {
    if (this.instances.has(name)) {
      return this.instances.get(name)
    }

    const service = this.services.get(name)
    if (!service) {
      throw new Error(`Service '${name}' not registered`)
    }

    const instance = service.factory ? service.factory(this) : null

    if (service.singleton && instance) {
      this.instances.set(name, instance)
    }

    return instance
  }

  /**
   * Check if a service is registered
   * @param {string} name - Service name
   * @returns {boolean}
   */
  has(name) {
    return this.services.has(name) || this.instances.has(name)
  }

  /**
   * Get all registered service names
   * @returns {string[]}
   */
  keys() {
    return Array.from(new Set([
      ...this.services.keys(),
      ...this.instances.keys()
    ]))
  }

  /**
   * Clear all services and instances
   */
  clear() {
    this.services.clear()
    this.instances.clear()
    this.factories.clear()
  }

  /**
   * Create a child container with access to parent services
   * Useful for scoped services
   * @returns {ServiceContainer}
   */
  createChild() {
    const child = new ServiceContainer()
    const parentGet = this.get.bind(this)

    const originalGet = child.get.bind(child)
    child.get = (name) => {
      if (child.services.has(name) || child.instances.has(name)) {
        return originalGet(name)
      }
      return parentGet(name)
    }

    return child
  }
}
