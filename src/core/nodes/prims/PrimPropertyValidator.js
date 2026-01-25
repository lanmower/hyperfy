import { isEqual } from '../../utils/helpers/typeChecks.js'
import { defaults } from './PrimDefaults.js'
import { PROPERTY_SCHEMA } from './PrimPropertySchema.js'

export class PrimPropertyValidator {
  static validate(property, value, self) {
    const schema = PROPERTY_SCHEMA[property]
    if (!schema) throw new Error(`[prim] unknown property: ${property}`)

    const normalizedValue = schema.normalize ? schema.normalize(value, self) : value
    const defaultValue = defaults[property]
    const testValue = normalizedValue !== null && normalizedValue !== undefined ? normalizedValue : defaultValue

    if (!schema.validate(testValue, self)) {
      throw new Error(schema.error)
    }

    return { normalizedValue, defaultValue }
  }

  static isEqual(oldValue, newValue, property) {
    if (property === 'size') {
      return isEqual(oldValue, newValue)
    }
    return oldValue === newValue
  }

  static shouldRebuild(property) {
    return PROPERTY_SCHEMA[property]?.needsRebuild || false
  }

  static getHandleMethod(property) {
    return PROPERTY_SCHEMA[property]?.handle || null
  }
}
