export { SchemaValidator } from '../../core/validation/SchemaValidator.js'
export { APIDocumenter } from './SchemaValidator.js'

let schemaValidator = null
let apiDocumenter = null

import { SchemaValidator } from '../../core/validation/SchemaValidator.js'
import { APIDocumenter } from './SchemaValidator.js'

export function initializeAPI(options = {}) {
  schemaValidator = new SchemaValidator()
  apiDocumenter = new APIDocumenter()

  return {
    schemaValidator,
    apiDocumenter
  }
}

export function getSchemaValidator() {
  return schemaValidator
}

export function getAPIDocumenter() {
  return apiDocumenter
}

export function createValidationMiddleware(schemaName) {
  return (req, res, next) => {
    if (!schemaValidator) {
      return next()
    }

    const result = schemaValidator.validateRequest(schemaName, req.body)

    if (!result.valid) {
      return res.status(400).json({
        status: 400,
        message: 'Validation failed',
        errors: result.errors
      })
    }

    next()
  }
}
