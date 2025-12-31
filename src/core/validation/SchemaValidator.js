import { BaseValidator } from './BaseValidator.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('SchemaValidator')

export class SchemaValidator extends BaseValidator {
  constructor() {
    super('SchemaValidator')
    this.schemas = new Map()
    this.validations = 0
    this.validationErrors = 0
  }

  registerSchema(name, schema) {
    this.schemas.set(name, schema)
    logger.debug('Schema registered', { name })
  }

  validateRequest(schemaName, data) {
    const schema = this.schemas.get(schemaName)
    if (!schema) {
      throw new Error(`Schema not found: ${schemaName}`)
    }

    this.validations++
    const errors = this.validate(data, schema)

    if (errors.length) {
      this.validationErrors++
      return { valid: false, errors }
    }

    return { valid: true, errors: [] }
  }

  validate(data, schema) {
    const errors = []

    if (schema.type) {
      const typeError = this.validateType(data, schema.type)
      if (typeError) errors.push(typeError)
    }

    if (schema.required && (data === null || data === undefined)) {
      errors.push(`Field is required`)
    }

    if (schema.properties && typeof data === 'object') {
      for (const [key, fieldSchema] of Object.entries(schema.properties)) {
        if (fieldSchema.required && !(key in data)) {
          errors.push(`Missing required field: ${key}`)
        }

        if (key in data) {
          const fieldErrors = this.validate(data[key], fieldSchema)
          errors.push(...fieldErrors.map(e => `${key}: ${e}`))
        }
      }
    }

    if (schema.items && Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        const itemErrors = this.validate(data[i], schema.items)
        errors.push(...itemErrors.map(e => `[${i}]: ${e}`))
      }
    }

    if (schema.minLength && typeof data === 'string' && data.length < schema.minLength) {
      errors.push(`String length must be >= ${schema.minLength}`)
    }

    if (schema.maxLength && typeof data === 'string' && data.length > schema.maxLength) {
      errors.push(`String length must be <= ${schema.maxLength}`)
    }

    if (schema.minimum && typeof data === 'number' && data < schema.minimum) {
      errors.push(`Value must be >= ${schema.minimum}`)
    }

    if (schema.maximum && typeof data === 'number' && data > schema.maximum) {
      errors.push(`Value must be <= ${schema.maximum}`)
    }

    if (schema.pattern && typeof data === 'string') {
      const regex = new RegExp(schema.pattern)
      if (!regex.test(data)) {
        errors.push(`String does not match pattern: ${schema.pattern}`)
      }
    }

    if (schema.enum && !schema.enum.includes(data)) {
      errors.push(`Value must be one of: ${schema.enum.join(', ')}`)
    }

    return errors
  }

  validateType(data, expectedType) {
    const actualType = Array.isArray(data) ? 'array' : typeof data

    if (actualType !== expectedType) {
      return `Expected ${expectedType}, got ${actualType}`
    }

    return null
  }

  getStats() {
    const errorRate = this.validations > 0
      ? ((this.validationErrors / this.validations) * 100).toFixed(2)
      : 0

    return {
      validations: this.validations,
      errors: this.validationErrors,
      errorRate: errorRate + '%',
      schemas: this.schemas.size
    }
  }
}
