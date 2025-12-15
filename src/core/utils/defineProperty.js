// Define properties on a class with automatic getters/setters
export function defineProps(target, schema, defaults = {}) {
  for (const [key, config] of Object.entries(schema)) {
    const privateKey = `_${key}`
    const initialValue = defaults[key] ?? config.default ?? null

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
}
