export class ErrorHandlerRegistry {
  constructor() {
    this.handlers = new Map()
    this.globalHandlers = []
  }

  register(name, handler) {
    if (typeof handler.canHandle !== 'function') {
      throw new Error(`Handler ${name} must implement canHandle(event, isDuplicate)`)
    }
    if (typeof handler.handle !== 'function') {
      throw new Error(`Handler ${name} must implement handle(event, isDuplicate)`)
    }
    this.handlers.set(name, handler)
  }

  unregister(name) {
    this.handlers.delete(name)
  }

  registerGlobal(handler) {
    if (typeof handler.handle !== 'function') {
      throw new Error('Global handler must implement handle(event, isDuplicate)')
    }
    this.globalHandlers.push(handler)
  }

  unregisterGlobal(handler) {
    this.globalHandlers = this.globalHandlers.filter(h => h !== handler)
  }

  route(event, isDuplicate) {
    const handled = []

    for (const [name, handler] of this.handlers) {
      try {
        if (handler.canHandle(event, isDuplicate)) {
          handler.handle(event, isDuplicate)
          handled.push(name)
        }
      } catch (err) {
        console.error(`Handler ${name} error:`, err)
      }
    }

    for (const handler of this.globalHandlers) {
      try {
        handler.handle(event, isDuplicate)
      } catch (err) {
        console.error('Global handler error:', err)
      }
    }

    return handled
  }

  getHandler(name) {
    return this.handlers.get(name)
  }

  hasHandler(name) {
    return this.handlers.has(name)
  }

  clear() {
    this.handlers.clear()
    this.globalHandlers = []
  }
}
