// Base factory pattern for common configuration and validation patterns
import { StructuredLogger } from '../utils/logging/index.js'

export class BaseFactory {
  constructor(name, config = {}) {
    this.name = name
    this.config = config
    this.logger = new StructuredLogger(name)
    this.validateConfig()
  }

  validateConfig() {
    // Override in subclass to add config validation
  }

  getConfig(key, defaultValue = null) {
    if (!key) return this.config
    return this.config[key] !== undefined ? this.config[key] : defaultValue
  }

  setConfig(key, value) {
    this.config[key] = value
    this.logger.info(`Config updated`, { key, value })
  }

  create(options = {}) {
    throw new Error(`${this.name}.create() must be implemented`)
  }

  assertOptionType(value, expectedType, optionName) {
    const actualType = typeof value
    if (actualType !== expectedType) {
      throw new TypeError(
        `Option '${optionName}' must be of type ${expectedType}, got ${actualType}`
      )
    }
  }

  assertOptionExists(value, optionName) {
    if (value === null || value === undefined) {
      throw new Error(`Required option '${optionName}' is missing`)
    }
  }

  mergeOptions(defaults, overrides = {}) {
    return { ...defaults, ...overrides }
  }
}
