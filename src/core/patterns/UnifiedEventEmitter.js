import { StructuredLogger } from '../utils/logging/index.js'
import EventEmitter from 'eventemitter3'

export class UnifiedEventEmitter extends EventEmitter {
  constructor(name = 'UnifiedEventEmitter') {
    super()
    this.name = name
    this.logger = new StructuredLogger(name)
    this._priorityHandlers = new Map()
  }

  on(eventName, handler, options = {}) {
    if (!eventName || typeof handler !== 'function') {
      throw new Error('Invalid event name or handler')
    }

    if (options.priority !== undefined && options.priority !== 0) {
      if (!this._priorityHandlers.has(eventName)) {
        this._priorityHandlers.set(eventName, [])
      }
      const handlers = this._priorityHandlers.get(eventName)
      handlers.push({ handler, priority: options.priority })
      handlers.sort((a, b) => a.priority - b.priority)
      const wrapped = (...args) => handler(...args)
      super.on(eventName, wrapped)
      wrapped._original = handler
      return () => this.off(eventName, handler)
    }

    super.on(eventName, handler)
    return () => this.off(eventName, handler)
  }

  once(eventName, handler, options = {}) {
    if (!eventName || typeof handler !== 'function') {
      throw new Error('Invalid event name or handler')
    }
    super.once(eventName, handler)
    return () => this.off(eventName, handler)
  }

  off(eventName, handler) {
    return super.off(eventName, handler) || false
  }

  emit(eventName, ...args) {
    try {
      return super.emit(eventName, ...args)
    } catch (err) {
      this.logger.error(`Handler error for event '${eventName}'`, {
        error: err.message,
        stack: err.stack,
      })
      return false
    }
  }

  clear(eventName) {
    if (eventName) {
      this.removeAllListeners(eventName)
      this._priorityHandlers.delete(eventName)
    } else {
      this.removeAllListeners()
      this._priorityHandlers.clear()
    }
  }

  getListeners(eventName) {
    return this.listeners(eventName)
  }

  listenerCount(eventName) {
    return this.listenerCount(eventName)
  }

  eventNames() {
    return this.eventNames()
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
