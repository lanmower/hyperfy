

export class FactoryRegistry {
  constructor(options = {}) {
    this.factories = new Map()
    this.middleware = []
    this.options = options
  }

  
  register(type, factory) {
    if (typeof factory !== 'function') {
      throw new TypeError(`Factory for '${type}' must be a function`)
    }
    this.factories.set(type, factory)
    return this
  }

  
  registerBulk(map) {
    for (const [type, factory] of Object.entries(map)) {
      this.register(type, factory)
    }
    return this
  }

  
  unregister(type) {
    this.factories.delete(type)
    return this
  }

  
  create(type, ...args) {
    const factory = this.factories.get(type)
    if (!factory) {
      throw new Error(`No factory registered for type: '${type}'`)
    }

    let result = factory(...args)

    for (const mw of this.middleware) {
      result = mw(result, type, args) || result
    }

    return result
  }

  
  async createAsync(type, ...args) {
    const factory = this.factories.get(type)
    if (!factory) {
      throw new Error(`No factory registered for type: '${type}'`)
    }

    let result = await factory(...args)

    for (const mw of this.middleware) {
      result = (await mw(result, type, args)) || result
    }

    return result
  }

  
  use(middleware) {
    this.middleware.push(middleware)
    return this
  }

  
  has(type) {
    return this.factories.has(type)
  }

  
  types() {
    return Array.from(this.factories.keys())
  }

  
  clear() {
    this.factories.clear()
    return this
  }

  
  size() {
    return this.factories.size
  }

  
  clone() {
    const clone = new FactoryRegistry(this.options)
    for (const [type, factory] of this.factories) {
      clone.register(type, factory)
    }
    for (const mw of this.middleware) {
      clone.use(mw)
    }
    return clone
  }
}


export const globalFactoryRegistry = new FactoryRegistry()
