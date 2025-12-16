// Define properties on a class with automatic getters/setters
export function defineProps(target, schema, defaults = {}, data = {}) {
  for (const [key, config] of Object.entries(schema)) {
    const privateKey = `_${key}`
    const initialValue = data[key] !== undefined ? data[key] : defaults[key] ?? config.default ?? null

    // Getter
    Object.defineProperty(target, key, {
      get() {
        return this[privateKey]
      },
      set(value) {
        if (value === undefined) {
          value = defaults[key] ?? config.default
        }

        // Validation
        if (config.validate) {
          const error = config.validate(value)
          if (error) throw new Error(error)
        }

        this[privateKey] = value

        // Side effects
        if (config.onSet) {
          config.onSet.call(this, value)
        }
      },
      configurable: true,
      enumerable: false,
    })

    // Initialize private property
    if (!target.hasOwnProperty(privateKey)) {
      target[privateKey] = initialValue
    }
  }
}

// Common onSet handlers
export function onSetRebuild() {
  return function() {
    this.needsRebuild = true
    this.setDirty()
  }
}

export function onSetRebuildIf(condition) {
  return function() {
    if (condition.call(this)) {
      this.needsRebuild = true
      this.setDirty()
    }
  }
}

// Proxy generator for schema-based properties
// Supports both underscore-prefixed (_prop) and non-prefixed (prop) property schemas
export function createPropertyProxy(instance, propertySchema, superProxy, customMethods = {}, customProperties = {}) {
  const self = instance
  const proxy = {}

  // Create getter/setter pairs for all schema properties
  for (const key in propertySchema) {
    // Auto-detect if property uses underscore prefix (e.g., _src or src)
    const propKey = `_${key}` in self ? `_${key}` : key

    Object.defineProperty(proxy, key, {
      get() {
        return self[propKey]
      },
      set(value) {
        self[propKey] = value
      },
      enumerable: true,
      configurable: true,
    })
  }

  // Add custom properties (getters/setters)
  // Format: { propName: { get: fn, set: fn } } or { propName: fn } for read-only
  for (const [name, prop] of Object.entries(customProperties)) {
    if (typeof prop === 'function') {
      // Read-only getter
      Object.defineProperty(proxy, name, {
        get: prop.bind(self),
        enumerable: true,
        configurable: true,
      })
    } else {
      // Custom getter/setter pair
      Object.defineProperty(proxy, name, {
        get: prop.get ? prop.get.bind(self) : undefined,
        set: prop.set ? prop.set.bind(self) : undefined,
        enumerable: true,
        configurable: true,
      })
    }
  }

  // Add custom methods
  for (const [name, method] of Object.entries(customMethods)) {
    proxy[name] = method.bind(self)
  }

  // Inherit Node properties from superProxy
  return Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(superProxy))
}

// Validator factories
export const validators = {
  string: (value) => (!value || typeof value === 'string') ? null : 'must be string',
  number: (value) => (typeof value === 'number') ? null : 'must be number',
  boolean: (value) => (typeof value === 'boolean') ? null : 'must be boolean',
  array: (value) => (Array.isArray(value)) ? null : 'must be array',
  enum: (allowed) => (value) => (allowed.includes(value)) ? null : `must be one of: ${allowed.join(', ')}`,
  func: (value) => (typeof value === 'function') ? null : 'must be function',
  stringOrNull: (value) => (value === null || typeof value === 'string') ? null : 'must be string or null',
  numberOrNull: (value) => (value === null || typeof value === 'number') ? null : 'must be number or null',
  functionOrNull: (value) => (value === null || typeof value === 'function') ? null : 'must be function or null',
  stringOrNumber: (value) => (typeof value === 'string' || typeof value === 'number') ? null : 'must be string or number',
  stringOrNumberOrNull: (value) => (value === null || typeof value === 'string' || typeof value === 'number') ? null : 'must be string, number, or null',
  numberMin: (min) => (value) => (typeof value === 'number' && value >= min) ? null : `must be number >= ${min}`,
}
