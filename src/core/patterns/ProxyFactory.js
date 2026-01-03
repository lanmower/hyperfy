// Consolidates proxy creation patterns with caching, method/getter-setter delegation, and schema-driven generation
export class ProxyFactory {
  static createCachedProxy(key, createFn, registry) {
    const cached = registry.getProxy(key)
    if (cached) return cached
    const proxy = createFn()
    registry.cache.set(key, proxy)
    return proxy
  }

  static createGetterSetterProxy(target, methods) {
    const { getters = {}, setters = {}, methodMap = {} } = methods
    return new Proxy({}, {
      get: (obj, key) => {
        if (getters[key]) return getters[key](target)
        if (methodMap[key]) return (...args) => methodMap[key](target, ...args)
        return target[key]
      },
      set: (obj, key, value) => {
        if (setters[key]) {
          setters[key](target, value)
          return true
        }
        target[key] = value
        return true
      },
      has: (obj, key) => !!(getters[key] || setters[key] || methodMap[key]),
      ownKeys: (obj) => {
        const keys = new Set([
          ...Object.keys(getters),
          ...Object.keys(setters),
          ...Object.keys(methodMap),
        ])
        return Array.from(keys)
      },
      getOwnPropertyDescriptor: (obj, key) => {
        if (getters[key] || setters[key] || methodMap[key]) {
          return { enumerable: true, configurable: true }
        }
        return undefined
      },
    })
  }
}
