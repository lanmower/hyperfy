// Factory pattern for creating standardized API routes with consistent error handling and logging
import { APIMethodWrapper } from '../utils/api/index.js'
import { LoggerFactory } from '../../core/utils/logging/index.js'

export class RouteFactory {
  static createRoute(name) {
    return new RouteBuilder(name)
  }
}

class RouteBuilder {
  constructor(name) {
    this.name = name
    this.logger = LoggerFactory.get(`Routes.${name}`)
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
