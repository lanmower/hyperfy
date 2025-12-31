// Factory pattern for creating standardized API routes with consistent error handling and logging
import { APIMethodWrapper } from '../utils/api/index.js'
import { StructuredLogger } from '../../core/utils/logging/index.js'

export class RouteFactory {
  static createRoute(name) {
    return new RouteBuilder(name)
  }
}

class RouteBuilder {
  constructor(name) {
    this.name = name
    this.logger = new StructuredLogger(`Routes.${name}`)
    this.routes = []
  }

  get(path, handler, options = {}) {
    this.routes.push({
      method: 'get',
      path,
      handler,
      options,
    })
    return this
  }

  post(path, handler, options = {}) {
    this.routes.push({
      method: 'post',
      path,
      handler,
      options,
    })
    return this
  }

  put(path, handler, options = {}) {
    this.routes.push({
      method: 'put',
      path,
      handler,
      options,
    })
    return this
  }

  delete(path, handler, options = {}) {
    this.routes.push({
      method: 'delete',
      path,
      handler,
      options,
    })
    return this
  }

  register(fastify) {
    for (const route of this.routes) {
      const wrappedHandler = this._wrapHandler(route.handler, route.path)
      const opts = {
        ...route.options,
        preHandler: route.options.preHandler || [],
      }

      if (typeof opts.preHandler !== 'function' && !Array.isArray(opts.preHandler)) {
        opts.preHandler = []
      }

      fastify[route.method](route.path, opts, wrappedHandler)
    }
  }

  _wrapHandler(handler, path) {
    return async (req, reply) => {
      return await APIMethodWrapper.wrapFastifyMethod(
        () => handler(req, reply, this.logger),
        reply,
        {
          logger: this.logger,
          defaultStatusCode: 500,
          defaultMessage: `Failed to process ${path}`,
        }
      )
    }
  }
}

// Middleware factory for standardized middleware patterns
export class MiddlewareFactory {
  static createAuthMiddleware(validator) {
    return (req, reply, done) => {
      const token = req.headers.authorization?.split(' ')[1]
      if (!token || !validator(token)) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }
      done()
    }
  }

  static createValidationMiddleware(validator) {
    return (req, reply, done) => {
      const result = validator(req.body)
      if (!result.valid) {
        return reply.code(400).send({ error: 'Validation failed', details: result.errors })
      }
      done()
    }
  }

  static createErrorHandler(logger) {
    return (error, req, reply) => {
      logger.error('Request error', { error: error.message, path: req.url })
      reply.code(500).send({ error: 'Internal server error' })
    }
  }
}

// Service registry for dependency injection in routes
export class ServiceRegistry {
  constructor() {
    this.services = new Map()
  }

  register(name, instance) {
    this.services.set(name, instance)
  }

  get(name) {
    const service = this.services.get(name)
    if (!service) {
      throw new Error(`Service ${name} not registered`)
    }
    return service
  }

  has(name) {
    return this.services.has(name)
  }
}

export const globalServiceRegistry = new ServiceRegistry()
