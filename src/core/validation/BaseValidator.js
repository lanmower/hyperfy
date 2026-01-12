export class BaseValidator {
  constructor(name) {
    this.name = name
  }

  validate(data) {
    const errors = this.getErrors(data)
    if (errors.length) {
      const error = new Error(`Validation failed: ${errors[0]}`)
      error.name = 'ValidationError'
      error.errors = errors
      error.validator = this.name
      throw error
    }
    return this.clean(data)
  }

  getErrors(data) {
    return []
  }

  clean(data) {
    return data
  }

  getSchema() {
    return null
  }
}
