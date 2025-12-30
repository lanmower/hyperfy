import { adminOnlyMiddleware } from '../middleware/authMiddleware.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'
import { APIMethodWrapper } from '../utils/api/APIMethodWrapper.js'

const logger = new ComponentLogger('Routes.Admin.Cors')

export function registerAdminCorsRoutes(fastify) {
  fastify.get('/api/admin/cors', { preHandler: adminOnlyMiddleware }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        if (!fastify.corsConfig) return reply.code(503).send({ error: 'CORS config not available' })
        logger.info('Get CORS config')
        return reply.code(200).send({
          success: true,
          config: fastify.corsConfig.getConfig(),
          stats: fastify.corsConfig.getStats(),
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to get CORS config' }
    )
  })

  fastify.post('/api/admin/cors/origin', { preHandler: adminOnlyMiddleware }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { origin } = req.body
        if (!origin) return reply.code(400).send({ error: 'Origin is required' })
        if (!fastify.corsConfig) return reply.code(503).send({ error: 'CORS config not available' })
        logger.info('Add CORS origin', { origin })
        return reply.code(200).send({
          success: true,
          origin,
          added: fastify.corsConfig.addOrigin(origin),
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to add CORS origin' }
    )
  })

  fastify.delete('/api/admin/cors/origin', { preHandler: adminOnlyMiddleware }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { origin } = req.body
        if (!origin) return reply.code(400).send({ error: 'Origin is required' })
        if (!fastify.corsConfig) return reply.code(503).send({ error: 'CORS config not available' })
        logger.info('Remove CORS origin', { origin })
        return reply.code(200).send({
          success: true,
          origin,
          removed: fastify.corsConfig.removeOrigin(origin),
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to remove CORS origin' }
    )
  })
}
