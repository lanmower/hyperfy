import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

export class UnifiedEventEmitter {
  constructor(name = 'UnifiedEventEmitter') {
    this.name = name
    this.logger = new ComponentLogger(name)
    this.handlers = new Map()
  }

  on(eventName, handler, options = {}) {
    if (!eventName || typeof handler !== 'function') {
      throw new Error('Invalid event name or handler')
    }

    const listener = {
      event: eventName,
      handler,
      once: options.once || false,
      priority: options.priority ?? 0,
    }

    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, [])
    }

    const handlers = this.handlers.get(eventName)
    handlers.push(listener)
    handlers.sort((a, b) => a.priority - b.priority)

    return () => this.off(eventName, handler)
  }

  once(eventName, handler, options = {}) {
    return this.on(eventName, handler, { ...options, once: true })
  }

  off(eventName, handler) {
    if (!this.handlers.has(eventName)) return false

    const handlers = this.handlers.get(eventName)
    const index = handlers.findIndex(h => h.handler === handler)

    if (index !== -1) {
      handlers.splice(index, 1)
      return true
    }

    return false
  }

  emit(eventName, ...args) {
    if (!this.handlers.has(eventName)) return false

    const handlers = this.handlers.get(eventName)
    let handled = false

    for (const listener of handlers) {
      try {
        listener.handler(...args)
        handled = true

        if (listener.once) {
          this.off(eventName, listener.handler)
        }
      } catch (err) {
        this.logger.error(`Handler error for event '${eventName}'`, {
          error: err.message,
          stack: err.stack,
        })
      }
    }

    return handled
  }

  clear(eventName) {
    if (eventName) {
      this.handlers.delete(eventName)
    } else {
      this.handlers.clear()
    }
  }

  getListeners(eventName) {
    return (this.handlers.get(eventName) || []).map(l => l.handler)
  }

  listenerCount(eventName) {
    return (this.handlers.get(eventName) || []).length
  }

  eventNames() {
    return Array.from(this.handlers.keys())
  }

  [Symbol.for('dispose')]() {
    this.clear()
  }

  static create() {
    return new UnifiedEventEmitter()
  }

  static createWith(defaultHandlers = {}) {
    const emitter = new UnifiedEventEmitter()
    for (const [event, handler] of Object.entries(defaultHandlers)) {
      if (typeof handler === 'function') {
        emitter.on(event, handler)
      }
    }
    return emitter
  }
}
