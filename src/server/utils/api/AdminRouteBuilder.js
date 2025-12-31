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

  createListRoute(fastify, path, listFunc, description) {
    this.createRoute(fastify, 'get', path, async (request, reply, fastify) => {
      const page = parseInt(request.query.page) || 1
      const limit = parseInt(request.query.limit) || 20
      const { items, total } = await listFunc(fastify, page, limit)
      return reply.code(200).send({
        success: true,
        items,
        total,
        page,
        limit,
      })
    }, description)
  }

  createDetailRoute(fastify, path, getFunc, description) {
    this.createRoute(fastify, 'get', path, async (request, reply, fastify) => {
      const { id } = request.params
      const item = await getFunc(fastify, id)
      if (!item) return reply.code(404).send({ error: `Item ${id} not found`, success: false })
      return reply.code(200).send({ success: true, item })
    }, description)
  }

  createUpdateRoute(fastify, path, updateFunc, description) {
    this.createRoute(fastify, 'patch', path, async (request, reply, fastify) => {
      const { id } = request.params
      const updated = await updateFunc(fastify, id, request.body)
      return reply.code(200).send({ success: true, updated })
    }, description)
  }

  createBulkActionRoute(fastify, path, actionFunc, description) {
    this.createRoute(fastify, 'post', path, async (request, reply, fastify) => {
      const { ids, action } = request.body
      if (!ids || !Array.isArray(ids)) return reply.code(400).send({ error: 'ids array required', success: false })
      if (!action) return reply.code(400).send({ error: 'action required', success: false })
      const results = await actionFunc(fastify, ids, action)
      return reply.code(200).send({ success: true, affected: ids.length, results })
    }, description)
  }

  createExportRoute(fastify, path, exportFunc, description) {
    this.createRoute(fastify, 'get', path, async (request, reply, fastify) => {
      const format = request.query.format || 'json'
      const data = await exportFunc(fastify, format)
      if (format === 'csv') {
        reply.type('text/csv').code(200).send(data)
      } else {
        reply.code(200).send({ success: true, data })
      }
    }, description)
  }

  logInfo(message, context = {}) {
    this.logger.info(message, context)
  }
}
