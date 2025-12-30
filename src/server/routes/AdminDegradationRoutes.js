import { adminOnlyMiddleware } from '../middleware/authMiddleware.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'
import { APIMethodWrapper } from '../utils/api/APIMethodWrapper.js'

const logger = new ComponentLogger('Routes.Admin.Degradation')

export function registerAdminDegradationRoutes(fastify) {
  fastify.get('/api/admin/degradation', { preHandler: adminOnlyMiddleware }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        if (!fastify.degradationManager) return reply.code(503).send({ error: 'Degradation manager not available' })
        logger.info('Get degradation status')
        return reply.code(200).send({
          success: true,
          ...fastify.degradationManager.getAllStatus(),
          stats: fastify.degradationManager.getStats(),
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to get degradation status' }
    )
  })

  fastify.get('/api/admin/degradation/:service', { preHandler: adminOnlyMiddleware }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { service } = req.params
        if (!fastify.degradationManager) return reply.code(503).send({ error: 'Degradation manager not available' })
        logger.info('Get service degradation status', { service })
        return reply.code(200).send({
          success: true,
          service: fastify.degradationManager.getServiceStatus(service),
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to get service degradation status' }
    )
  })

  fastify.post('/api/admin/degradation/force-mode', { preHandler: adminOnlyMiddleware }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { mode, reason } = req.body
        if (!mode) return reply.code(400).send({ error: 'Mode is required' })
        if (!fastify.degradationManager) return reply.code(503).send({ error: 'Degradation manager not available' })
        logger.info('Force degradation mode', { mode })
        return reply.code(200).send({
          success: true,
          ...fastify.degradationManager.forceMode(mode, reason || 'Admin override'),
          status: fastify.degradationManager.getAllStatus(),
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to force degradation mode' }
    )
  })
}
