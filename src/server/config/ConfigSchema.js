/**
 * Configuration schema validator - validates configuration against defined rules
 * Ensures all required values are present, have correct types, and are within acceptable ranges
 * Fails fast on invalid configuration with clear error messages
 */

export class ConfigSchema {
  static schemas = {}

  /**
   * Define schema for a configuration section
   * @param {string} section - Section name (e.g., 'network', 'security')
   * @param {Object} schema - Validation rules for fields in this section
   * @returns {ConfigSchema} this (for chaining)
   */
  static define(section, schema) {
    this.schemas[section] = schema
    return this
  }

  /**
   * Validate configuration against all defined schemas
   * @param {Object} config - Configuration object to validate
   * @throws {Error} If validation fails with all error messages
   * @returns {boolean} true if valid
   */
  static validate(config) {
    const errors = this.getErrors(config)
    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`)
    }
    return true
  }

  /**
   * Validate a single section
   * @param {string} section - Section name
   * @param {Object} values - Values to validate
   * @throws {Error} If validation fails
   * @returns {boolean} true if valid
   */
  static validateSection(section, values) {
    const schema = this.schemas[section]
    if (!schema) {
      throw new Error(`No schema defined for section: ${section}`)
    }

    const errors = this.getSectionErrors(section, schema, values)
    if (errors.length > 0) {
      throw new Error(`Section [${section}] validation failed:\n${errors.join('\n')}`)
    }
    return true
  }

  /**
   * Get validation errors without throwing
   * @param {Object} config - Configuration to validate
   * @returns {Array<string>} Array of error messages
   */
  static getErrors(config) {
    const errors = []

    for (const [section, schema] of Object.entries(this.schemas)) {
      const sectionValues = config[section] || {}
      const sectionErrors = this.getSectionErrors(section, schema, sectionValues)
      errors.push(...sectionErrors)
    }

    return errors
  }

  /**
   * Get validation errors for a single section
   * @private
   * @param {string} section - Section name
   * @param {Object} schema - Schema definition for this section
   * @param {Object} values - Values to validate
   * @returns {Array<string>} Array of error messages
   */
  static getSectionErrors(section, schema, values) {
    const errors = []

    for (const [fieldName, rules] of Object.entries(schema)) {
      const value = values[fieldName]
      const fieldPath = `[${section}.${fieldName}]`

      // Check required
      if (rules.required && (value == null)) {
        errors.push(`${fieldPath} Required field is missing`)
        continue
      }

      // Skip validation if optional and not provided
      if (!rules.required && (value == null)) {
        continue
      }

      // Check type
      if (rules.type && !this.checkType(value, rules.type)) {
        const actualType = Array.isArray(value) ? 'array' : typeof value
        errors.push(`${fieldPath} Must be ${rules.type} (got ${actualType})`)
        continue
      }

      // Check min/max for numbers
      if (rules.type === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${fieldPath} Must be >= ${rules.min} (got ${value})`)
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${fieldPath} Must be <= ${rules.max} (got ${value})`)
        }
      }

      // Check minLength/maxLength for strings
      if (rules.type === 'string') {
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push(`${fieldPath} Minimum length is ${rules.minLength} (got ${value.length})`)
        }
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push(`${fieldPath} Maximum length is ${rules.maxLength} (got ${value.length})`)
        }
      }

      // Check enum
      if (rules.enum && !rules.enum.includes(value)) {
        const allowed = rules.enum.join(', ')
        errors.push(`${fieldPath} Must be one of: ${allowed} (got ${value})`)
      }

      // Check custom validation
      if (rules.validate && typeof rules.validate === 'function') {
        if (!rules.validate(value)) {
          errors.push(`${fieldPath} Custom validation failed (got ${value})`)
        }
      }
    }

    return errors
  }

  /**
   * Check if value matches expected type
   * @private
   * @param {*} value - Value to check
   * @param {string} type - Expected type name
   * @returns {boolean} true if type matches
   */
  static checkType(value, type) {
    const normalizedType = type.toLowerCase()

    if (normalizedType === 'number') {
      return typeof value === 'number' && !isNaN(value)
    }

    if (normalizedType === 'string') {
      return typeof value === 'string'
    }

    if (normalizedType === 'boolean') {
      return typeof value === 'boolean'
    }

    if (normalizedType === 'object') {
      return value !== null && typeof value === 'object' && !Array.isArray(value)
    }

    if (normalizedType === 'array') {
      return Array.isArray(value)
    }

    return typeof value === normalizedType
  }
}

export default ConfigSchema
