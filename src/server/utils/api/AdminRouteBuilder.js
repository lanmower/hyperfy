/* AdminRouteBuilder: Consolidates admin route patterns */
import { adminOnlyMiddleware } from '../../middleware/authMiddleware.js'
import { ComponentLogger } from '../../../core/utils/logging/ComponentLogger.js'
import { APIMethodWrapper } from './APIMethodWrapper.js'

export class AdminRouteBuilder {
  constructor(loggerName) {
    this.logger = new ComponentLogger(loggerName)
  }

  createRoute(fastify, method, path, handler, description) {
    const wrappedHandler = async (request, reply) => {
      return APIMethodWrapper.wrapFastifyMethod(
        () => handler(request, reply, fastify),
        reply,
        { logger: this.logger, defaultStatusCode: 500, defaultMessage: `Failed to ${description}` }
      )
    }

    fastify[method](path, { preHandler: adminOnlyMiddleware }, wrappedHandler)
  }

  createGetRoute(fastify, path, handler, description) {
    this.createRoute(fastify, 'get', path, handler, description)
  }

  createPostRoute(fastify, path, handler, description) {
    this.createRoute(fastify, 'post', path, handler, description)
  }

  createDeleteRoute(fastify, path, handler, description) {
    this.createRoute(fastify, 'delete', path, handler, description)
  }

  createStatsRoute(fastify, path, getStatsFunc, description) {
    this.createRoute(fastify, 'get', path, async (request, reply, fastify) => {
      const stats = await getStatsFunc(fastify)
      return reply.code(200).send({
        success: true,
        ...stats,
      })
    }, description)
  }

  createResetRoute(fastify, path, resetFunc, description) {
    this.createRoute(fastify, 'post', path, async (request, reply, fastify) => {
      const { name } = request.params
      const result = await resetFunc(fastify, name)
      return reply.code(200).send({
        success: true,
        ...result,
      })
    }, description)
  }

  logInfo(message, context = {}) {
    this.logger.info(message, context)
  }
}
