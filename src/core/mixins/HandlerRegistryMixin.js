

export const withHandlerRegistry = (Base) => class extends Base {
  constructor(...args) {
    super(...args)
    this.handlers = new Map()
    this.registerHandlers(this.getHandlerMap())
  }

  
  getHandlerMap() {
    return {}
  }

  
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

  
  registerHandler(name, handler) {
    this.handlers.set(name, handler.bind(this))
  }

  
  unregisterHandler(name) {
    this.handlers.delete(name)
  }

  
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

  
  hasHandler(name) {
    return this.handlers.has(name)
  }

  
  getHandlerNames() {
    return Array.from(this.handlers.keys())
  }
}
