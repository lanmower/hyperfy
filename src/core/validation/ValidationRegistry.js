import { WebSocketValidator } from './WebSocketValidator.js'
import { FileUploadValidator } from './FileUploadValidator.js'
import { AppValidator } from './AppValidator.js'
import { SchemaValidator } from './SchemaValidator.js'

export class ValidationRegistry {
  static instance = null
  static validators = new Map()

  static getInstance() {
    if (!ValidationRegistry.instance) {
      ValidationRegistry.instance = new ValidationRegistry()
      ValidationRegistry.instance.register('websocket', new WebSocketValidator())
      ValidationRegistry.instance.register('fileUpload', new FileUploadValidator())
      ValidationRegistry.instance.register('app', new AppValidator())
      ValidationRegistry.instance.register('schema', new SchemaValidator())
    }
    return ValidationRegistry.instance
  }

  register(name, validator) {
    ValidationRegistry.validators.set(name, validator)
    return this
  }

  get(name) {
    return ValidationRegistry.validators.get(name)
  }

  validate(name, data) {
    const validator = this.get(name)
    if (!validator) {
      throw new Error(`Validator not found: ${name}`)
    }
    return validator.validate(data)
  }

  all() {
    return Array.from(ValidationRegistry.validators.values())
  }

  getNames() {
    return Array.from(ValidationRegistry.validators.keys())
  }

  static reset() {
    ValidationRegistry.instance = null
    ValidationRegistry.validators.clear()
  }
}

export const validationRegistry = ValidationRegistry.getInstance()
