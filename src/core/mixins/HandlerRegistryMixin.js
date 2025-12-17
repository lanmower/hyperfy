/**
 * Handler Registry Mixin
 *
 * Provides a standardized way to register and dispatch message/command handlers.
 * Reduces boilerplate in systems that need to handle multiple message types.
 *
 * Usage:
 *   class MySystem extends withHandlerRegistry(System) {
 *     getHandlerMap() {
 *       return {
 *         'messageType1': this.handleMessage1,
 *         'messageType2': this.handleMessage2,
 *       }
 *     }
 *   }
 *
 *   const system = new MySystem(world)
 *   system.dispatch('messageType1', data)
 */

export const withHandlerRegistry = (Base) => class extends Base {
  constructor(...args) {
    super(...args)
    this.handlers = new Map()
    this.registerHandlers(this.getHandlerMap())
  }

  /**
   * Override this method to provide the handler map
   * @returns {Object} Map of { eventName: handlerFunction }
   */
  getHandlerMap() {
    return {}
  }

  /**
   * Register a set of handlers
   * @param {Object} map - Map of handler names to functions
   */
  registerHandlers(map) {
    for (const [name, handler] of Object.entries(map)) {
      if (typeof handler === 'function') {
        this.handlers.set(name, handler.bind(this))
      } else if (typeof handler === 'string') {
        const method = this[handler]
        if (typeof method === 'function') {
          this.handlers.set(name, method.bind(this))
        }
      }
    }
  }

  /**
   * Register a single handler
   * @param {string} name - Handler name
   * @param {Function} handler - Handler function
   */
  registerHandler(name, handler) {
    this.handlers.set(name, handler.bind(this))
  }

  /**
   * Unregister a handler
   * @param {string} name - Handler name
   */
  unregisterHandler(name) {
    this.handlers.delete(name)
  }

  /**
   * Dispatch a handler by name
   * @param {string} name - Handler name
   * @param {...any} args - Arguments to pass to handler
   * @returns {any} Handler result
   */
  dispatch(name, ...args) {
    const handler = this.handlers.get(name)
    if (!handler) {
      console.warn(`No handler registered for: ${name}`)
      return null
    }
    try {
      return handler(...args)
    } catch (err) {
      console.error(`Error in handler '${name}':`, err)
      throw err
    }
  }

  /**
   * Dispatch asynchronously
   * @param {string} name - Handler name
   * @param {...any} args - Arguments to pass to handler
   * @returns {Promise<any>} Handler result promise
   */
  async dispatchAsync(name, ...args) {
    const handler = this.handlers.get(name)
    if (!handler) {
      console.warn(`No handler registered for: ${name}`)
      return null
    }
    try {
      return await handler(...args)
    } catch (err) {
      console.error(`Error in async handler '${name}':`, err)
      throw err
    }
  }

  /**
   * Check if a handler is registered
   * @param {string} name - Handler name
   * @returns {boolean} True if handler exists
   */
  hasHandler(name) {
    return this.handlers.has(name)
  }

  /**
   * Get all registered handler names
   * @returns {string[]} Array of handler names
   */
  getHandlerNames() {
    return Array.from(this.handlers.keys())
  }
}
