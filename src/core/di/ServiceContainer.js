
export class ServiceContainer {
  constructor() {
    this.services = new Map()
    this.instances = new Map()
    this.factories = new Map()
  }

  
  register(name, factory, singleton = true) {
    if (typeof factory !== 'function') {
      throw new Error(`Factory for service '${name}' must be a function`)
    }
    this.services.set(name, { factory, singleton })
    return this
  }

  
  registerSingleton(name, instance) {
    this.instances.set(name, instance)
    this.services.set(name, { singleton: true })
    return this
  }

  
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

  
  has(name) {
    return this.services.has(name) || this.instances.has(name)
  }

  
  keys() {
    return Array.from(new Set([
      ...this.services.keys(),
      ...this.instances.keys()
    ]))
  }

  
  clear() {
    this.services.clear()
    this.instances.clear()
    this.factories.clear()
  }

  
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
