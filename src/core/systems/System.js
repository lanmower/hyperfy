// Inline EventEmitter to eliminate eventemitter3 dependency
class EventEmitter {
  constructor() {
    this._events = {}
  }

  on(event, listener) {
    if (!this._events[event]) {
      this._events[event] = []
    }
    this._events[event].push(listener)
    return this
  }

  off(event, listener) {
    if (!this._events[event]) return this
    this._events[event] = this._events[event].filter(l => l !== listener)
    return this
  }

  emit(event, ...args) {
    if (!this._events[event]) return false
    this._events[event].forEach(listener => listener(...args))
    return true
  }

  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args)
      this.off(event, wrapper)
    }
    this.on(event, wrapper)
    return this
  }

  removeAllListeners(event) {
    if (event) {
      delete this._events[event]
    } else {
      this._events = {}
    }
    return this
  }

  listeners(event) {
    return this._events[event] || []
  }

  listenerCount(event) {
    return (this._events[event] || []).length
  }
}

export class System extends EventEmitter {
  constructor(world) {
    super()
    this.world = world
    if (this.constructor.DEPS) {
      for (const [key, service] of Object.entries(this.constructor.DEPS)) {
        Object.defineProperty(this, key, {
          get: () => this.world[service],
          configurable: true,
        })
      }
    }
  }

  async init() {
  }

  start() {
    if (this.constructor.EVENTS && this.events) {
      for (const [event, method] of Object.entries(this.constructor.EVENTS)) {
        if (typeof this[method] === 'function') {
          this.events.on(event, this[method].bind ? this[method].bind(this) : this[method])
        }
      }
    }
  }

  preTick() {
  }

  preFixedUpdate(willFixedStep) {
  }

  fixedUpdate(delta) {
  }

  postFixedUpdate() {
  }

  preUpdate(alpha) {
  }

  update(delta) {
  }

  postUpdate() {
  }

  lateUpdate(delta) {
  }

  postLateUpdate() {
  }

  commit() {
  }

  postTick() {
  }

  destroy() {
  }
}
