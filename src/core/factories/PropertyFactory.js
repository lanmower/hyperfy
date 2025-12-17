

import { cloneDeep } from 'lodash-es'


export function applyProperties(instance, propertySchema, data = {}) {
  for (const [key, definition] of Object.entries(propertySchema)) {
    const value = data[key]

    if (value !== undefined && value !== null) {
      instance[key] = coercePropertyValue(value, definition)
    } else {
      instance[key] = cloneDeep(definition.default)
    }

    if (definition.onChanged) {
      const originalValue = instance[key]
      Object.defineProperty(instance, key, {
        get() {
          return originalValue
        },
        set(newValue) {
          const coercedValue = coercePropertyValue(newValue, definition)
          if (originalValue !== coercedValue) {
            definition.onChanged.call(instance, coercedValue, originalValue)
          }
        },
        configurable: true,
        enumerable: true
      })
    }
  }
}


function coercePropertyValue(value, definition) {
  const { type } = definition

  if (!type) return value

  switch (type) {
    case 'vec2':
    case 'vec3':
    case 'vec4':
      return Array.isArray(value) ? value : [value]

    case 'quat':
      return Array.isArray(value) ? value : [0, 0, 0, 1]

    case 'number':
      return Number(value)

    case 'boolean':
      return Boolean(value)

    case 'string':
      return String(value)

    case 'array':
      return Array.isArray(value) ? value : [value]

    case 'object':
      return value && typeof value === 'object' ? value : {}

    default:
      return value
  }
}


export function validateProperties(propertySchema, data) {
  const errors = []

  for (const [key, definition] of Object.entries(propertySchema)) {
    if (!definition.default && definition.required) {
      if (!(key in data) || data[key] === undefined) {
        errors.push(`Missing required property: ${key}`)
      }
    }

    if (key in data && data[key] !== null && data[key] !== undefined) {
      const value = data[key]

      if (definition.validate) {
        const isValid = definition.validate(value)
        if (!isValid) {
          errors.push(`Invalid value for property ${key}: ${JSON.stringify(value)}`)
        }
      }
    }
  }

  return errors
}


export function getPropertySchema(nodeClass) {
  const properties = {}

  let currentClass = nodeClass
  while (currentClass && currentClass !== Object) {
    if (currentClass.properties) {
      Object.assign(properties, currentClass.properties)
    }
    currentClass = Object.getPrototypeOf(currentClass)
  }

  return properties
}


export function serializeProperties(instance, propertySchema) {
  const serialized = {}

  for (const key of Object.keys(propertySchema)) {
    if (key in instance) {
      const value = instance[key]
      const definition = propertySchema[key]

      if (definition.skipDefaults && JSON.stringify(value) === JSON.stringify(definition.default)) {
        continue
      }

      serialized[key] = value
    }
  }

  return serialized
}


export class PropertyBuilder {
  constructor() {
    this.schema = {}
  }

  static create() {
    return new PropertyBuilder()
  }

  number(name, options = {}) {
    this.schema[name] = { ...options, type: 'number', default: options.default ?? 0 }
    return this
  }

  boolean(name, options = {}) {
    this.schema[name] = { ...options, type: 'boolean', default: options.default ?? false }
    return this
  }

  string(name, options = {}) {
    this.schema[name] = { ...options, type: 'string', default: options.default ?? '' }
    return this
  }

  vec2(name, options = {}) {
    this.schema[name] = { ...options, type: 'vec2', default: options.default ?? [0, 0] }
    return this
  }

  vec3(name, options = {}) {
    this.schema[name] = { ...options, type: 'vec3', default: options.default ?? [0, 0, 0] }
    return this
  }

  vec4(name, options = {}) {
    this.schema[name] = { ...options, type: 'vec4', default: options.default ?? [0, 0, 0, 1] }
    return this
  }

  quat(name, options = {}) {
    this.schema[name] = { ...options, type: 'quat', default: options.default ?? [0, 0, 0, 1] }
    return this
  }

  array(name, options = {}) {
    this.schema[name] = { ...options, type: 'array', default: options.default ?? [] }
    return this
  }

  object(name, options = {}) {
    this.schema[name] = { ...options, type: 'object', default: options.default ?? {} }
    return this
  }

  custom(name, options = {}) {
    this.schema[name] = options
    return this
  }

  build() {
    return this.schema
  }
}
