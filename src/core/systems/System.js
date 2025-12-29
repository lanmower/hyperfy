import EventEmitter from 'eventemitter3'

export class System extends EventEmitter {
  constructor(world) {
    super()
    this.world = world
    if (this.constructor.DEPS) {
      for (const [key, service] of Object.entries(this.constructor.DEPS)) {
        Object.defineProperty(this, key, {
          get: () => this.getService(service),
          configurable: true,
        })
      }
    }
  }

  getService(name) {
    if (this.world.di?.has?.(name)) {
      return this.world.di.get(name)
    }
    return this.world[name]
  }

  hasService(name) {
    return this.world.hasService?.(name) || this.world.di?.has?.(name) || name in this.world
  }

  getServiceOrThrow(name) {
    const service = this.getService(name)
    if (!service) {
      throw new Error(`Service '${name}' not found`)
    }
    return service
  }

  requireServices(...serviceNames) {
    const missing = serviceNames.filter(name => !this.hasService(name))
    if (missing.length > 0) {
      throw new Error(`System ${this.constructor.name} requires services: ${missing.join(', ')}`)
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
