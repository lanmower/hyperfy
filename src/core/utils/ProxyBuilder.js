export class ProxyBuilder {
  constructor(target) {
    this.target = target
    this.properties = new Map()
    this.methods = new Map()
  }

  addGetter(key, fn) {
    this.properties.set(key, { get: fn })
    return this
  }

  addSetter(key, fn) {
    const prop = this.properties.get(key) || {}
    prop.set = fn
    this.properties.set(key, prop)
    return this
  }

  addProperty(key, get, set) {
    this.properties.set(key, { get, set })
    return this
  }

  addMethod(key, fn) {
    this.methods.set(key, fn)
    return this
  }

  addReadOnly(key, get) {
    this.properties.set(key, {
      get,
      set: () => { throw new Error(`${key} is read-only`) }
    })
    return this
  }

  addMultiple(spec) {
    for (const [key, config] of Object.entries(spec)) {
      if (typeof config === 'function') {
        this.addGetter(key, config)
      } else if (config.get) {
        if (config.set) {
          this.addProperty(key, config.get, config.set)
        } else {
          this.addReadOnly(key, config.get)
        }
      } else if (config.method) {
        this.addMethod(key, config.method)
      }
    }
    return this
  }

  build(customProps = {}) {
    let proxy = customProps
    const descriptors = {}

    for (const [key, config] of this.properties) {
      descriptors[key] = {
        get: config.get,
        set: config.set || undefined,
        enumerable: true,
        configurable: true
      }
    }

    for (const [key, fn] of this.methods) {
      descriptors[key] = {
        value: fn.bind(this.target),
        enumerable: true,
        configurable: true
      }
    }

    if (Object.keys(descriptors).length > 0) {
      proxy = Object.defineProperties(proxy, descriptors)
    }

    return proxy
  }
}
