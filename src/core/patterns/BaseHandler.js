// Base handler pattern for common event and binding patterns
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

export class BaseHandler {
  constructor(name) {
    this.name = name
    this.logger = new ComponentLogger(name)
    this.handlers = new Map()
    this.listeners = []
  }

  on(eventName, handler, options = {}) {
    if (!eventName || typeof handler !== 'function') {
      throw new Error('Invalid event name or handler')
    }

    const listener = {
      event: eventName,
      handler,
      once: options.once || false,
      priority: options.priority || 0,
    }

    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, [])
    }

    const handlers = this.handlers.get(eventName)
    handlers.push(listener)
    handlers.sort((a, b) => b.priority - a.priority)
    this.listeners.push(listener)

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
      const listenerIndex = this.listeners.findIndex(l => l.handler === handler && l.event === eventName)
      if (listenerIndex !== -1) {
        this.listeners.splice(listenerIndex, 1)
      }
      return true
    }

    return false
  }

  emit(eventName, data) {
    if (!this.handlers.has(eventName)) return false

    const handlers = this.handlers.get(eventName)
    let handled = false

    for (const listener of handlers) {
      try {
        listener.handler(data)
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

  clearAllListeners() {
    this.handlers.clear()
    this.listeners = []
  }

  clearListeners(eventName) {
    this.handlers.delete(eventName)
    this.listeners = this.listeners.filter(l => l.event !== eventName)
  }

  getListenerCount(eventName = null) {
    if (!eventName) return this.listeners.length
    return (this.handlers.get(eventName) || []).length
  }
}
