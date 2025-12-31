/* BaseController: Server request handler pattern with template methods */
import { StructuredLogger } from '../utils/logging/index.js'

export class BaseController {
  constructor(name) {
    this.name = name
    this.logger = new StructuredLogger(name)
    this.logger.info('Controller initialized')
  }

  validate(data, schema) {
    if (!schema) return data
    const result = schema.safeParse(data)
    if (!result.success) {
      const error = new Error('Validation failed')
      error.code = 'VALIDATION_ERROR'
      error.details = result.error.errors
      throw error
    }
    return result.data
  }

  respond(reply, data = {}) {
    return reply.code(200).send({
      success: true,
      ...data,
    })
  }

  error(reply, code = 500, message = 'Internal server error') {
    const statusCode = typeof code === 'number' ? code : 500
    const errorMessage = typeof code === 'string' ? code : message
    return reply.code(statusCode).send({
      success: false,
      error: errorMessage,
    })
  }
}
