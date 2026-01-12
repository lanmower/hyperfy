/* Unified proxy factory registry for apps, nodes, and players */

export class ProxyRegistry {
  constructor() {
    this.factories = new Map()
    this.cache = new Map()
  }

  registerFactory(type, factory) {
    this.factories.set(type, factory)
  }

  createProxy(type, target, options = {}) {
    const factory = this.factories.get(type)
    if (!factory) throw new Error(`No proxy factory for type ${type}`)

    const cached = this.cache.get(target.id)
    if (cached) return cached

    const proxy = factory(target, options)
    this.cache.set(target.id, proxy)
    return proxy
  }

  getProxy(id) {
    return this.cache.get(id)
  }

  removeProxy(id) {
    this.cache.delete(id)
  }

  clear() {
    this.cache.clear()
  }

  getStats() {
    return {
      factories: this.factories.size,
      cached: this.cache.size
    }
  }
}
