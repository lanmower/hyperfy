import { BaseManager } from '../patterns/index.js'

export class EventListenerManager extends BaseManager {
  constructor(owner) {
    super(null, 'EventListenerManager')
    this.owner = owner
    this.listeners = []
  }

  bindHandler(handler) {
    return typeof handler === 'function' ? handler.bind(this.owner) : handler
  }

  removeListener(listener) {
    if (listener.dom) {
      listener.target.removeEventListener(listener.event, listener.handler, listener.options)
    } else {
      listener.emitter.off(listener.event, listener.handler)
    }
  }

  on(emitter, event, handler) { return this.addEmitterListener(emitter, event, handler, false) }
  once(emitter, event, handler) { return this.addEmitterListener(emitter, event, handler, true) }

  addEmitterListener(emitter, event, handler, once) {
    const method = once ? 'once' : 'on'
    if (!emitter || typeof emitter[method] !== 'function') {
      this.logger.error(`Invalid emitter provided to ${method}()`, { owner: this.owner.constructor.name })
      return
    }
    const boundHandler = this.bindHandler(handler)
    emitter[method](event, boundHandler)
    this.listeners.push({ emitter, event, handler: boundHandler, original: handler, once })
    return boundHandler
  }

  addEventListener(target, event, handler, options = {}) {
    if (!target || typeof target.addEventListener !== 'function') {
      this.logger.error('Invalid target provided to addEventListener()', { owner: this.owner.constructor.name })
      return
    }

    const boundHandler = this.bindHandler(handler)
    target.addEventListener(event, boundHandler, options)

    this.listeners.push({
      target,
      event,
      handler: boundHandler,
      original: handler,
      dom: true,
      options
    })

    return boundHandler
  }

  off(emitter, event, handler) {
    const index = this.listeners.findIndex(l =>
      l.emitter === emitter && l.event === event && (l.original === handler || l.handler === handler)
    )
    if (index >= 0) {
      const listener = this.listeners[index]
      emitter.off(event, listener.handler)
      this.listeners.splice(index, 1)
    }
  }

  removeEventListener(target, event, handler, options = {}) {
    const index = this.listeners.findIndex(l =>
      l.target === target && l.event === event && (l.original === handler || l.handler === handler) && l.dom
    )
    if (index >= 0) {
      const listener = this.listeners[index]
      target.removeEventListener(event, listener.handler, options)
      this.listeners.splice(index, 1)
    }
  }

  removeAllListeners(emitterOrTarget) {
    const toRemove = this.listeners.filter(l => l.emitter === emitterOrTarget || l.target === emitterOrTarget)
    for (const listener of toRemove) {
      this.removeListener(listener)
    }
    this.listeners = this.listeners.filter(l => !toRemove.includes(l))
  }

  clear() {
    for (const listener of this.listeners) {
      try {
        this.removeListener(listener)
      } catch (err) {
        this.logger.error('Failed to remove listener during cleanup', {
          owner: this.owner.constructor.name,
          event: listener.event,
          error: err.message
        })
      }
    }
    this.listeners = []
  }

  getStats() {
    const domListeners = this.listeners.filter(l => l.dom).length
    const emitterListeners = this.listeners.filter(l => !l.dom).length

    return {
      total: this.listeners.length,
      dom: domListeners,
      emitter: emitterListeners,
      byEvent: this.getListenersByEvent()
    }
  }

  getListenersByEvent() {
    const byEvent = {}
    for (const listener of this.listeners) {
      const event = listener.event
      byEvent[event] = (byEvent[event] || 0) + 1
    }
    return byEvent
  }

  async destroyInternal() {
    this.clear()
    this.owner = null
  }
}
