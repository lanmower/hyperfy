
export class Schema {
  constructor(name = 'Schema', fields = {}) {
    this.name = name
    this.fields = fields
  }

  static create(name, fields) {
    return new Schema(name, fields)
  }

  validate(data) {
    const errors = []
    for (const [key, field] of Object.entries(this.fields)) {
      const value = data[key]
      if (field.required && value === undefined) {
        errors.push(`${key} is required`)
      } else if (value !== undefined && field.type && typeof value !== field.type) {
        errors.push(`${key} must be ${field.type}, got ${typeof value}`)
      }
      if (field.validate && value !== undefined) {
        const err = field.validate(value)
        if (err) errors.push(err)
      }
    }
    return errors.length ? errors : null
  }

  normalize(data) {
    const normalized = {}
    for (const [key, field] of Object.entries(this.fields)) {
      let value = data[key]
      if (value === undefined && field.default !== undefined) {
        value = typeof field.default === 'function' ? field.default() : field.default
      }
      if (field.normalize && value !== undefined) {
        value = field.normalize(value)
      }
      if (value !== undefined) {
        normalized[key] = value
      }
    }
    return normalized
  }

  serialize(data) {
    const serialized = {}
    for (const [key, field] of Object.entries(this.fields)) {
      const value = data[key]
      if (value === undefined) continue
      if (field.serialize) {
        serialized[key] = field.serialize(value)
      } else {
        serialized[key] = value
      }
    }
    return serialized
  }

  deserialize(data) {
    const deserialized = {}
    for (const [key, field] of Object.entries(this.fields)) {
      const value = data[key]
      if (value === undefined) continue
      if (field.deserialize) {
        deserialized[key] = field.deserialize(value)
      } else {
        deserialized[key] = value
      }
    }
    return deserialized
  }

  toString() {
    return `${this.name}(${Object.keys(this.fields).length} fields)`
  }
}

export function field(options = {}) {
  return {
    type: options.type,
    required: options.required === true,
    default: options.default,
    validate: options.validate,
    normalize: options.normalize,
    serialize: options.serialize,
    deserialize: options.deserialize,
  }
}
