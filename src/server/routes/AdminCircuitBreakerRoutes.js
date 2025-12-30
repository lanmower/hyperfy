import { adminOnlyMiddleware } from '../middleware/authMiddleware.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'
import { APIMethodWrapper } from '../utils/api/APIMethodWrapper.js'

const logger = new ComponentLogger('Routes.Admin.CircuitBreaker')

export function registerAdminCircuitBreakerRoutes(fastify) {
  fastify.get('/api/admin/circuit-breakers', { preHandler: adminOnlyMiddleware }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        if (!fastify.circuitBreakerManager) return reply.code(503).send({ error: 'Circuit breaker manager not available' })
        logger.info('Get circuit breaker stats')
        return reply.code(200).send({
          success: true,
          ...fastify.circuitBreakerManager.getAllStats(),
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to get circuit breaker stats' }
    )
  })

  fastify.get('/api/admin/circuit-breakers/:name', { preHandler: adminOnlyMiddleware }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { name } = req.params
        if (!fastify.circuitBreakerManager) return reply.code(503).send({ error: 'Circuit breaker manager not available' })
        if (!fastify.circuitBreakerManager.has(name)) return reply.code(404).send({ error: `Circuit breaker ${name} not found` })
        logger.info('Get circuit breaker', { name })
        return reply.code(200).send({
          success: true,
          stats: fastify.circuitBreakerManager.getStats(name),
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to get circuit breaker' }
    )
  })

  fastify.post('/api/admin/circuit-breakers/:name/reset', { preHandler: adminOnlyMiddleware }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { name } = req.params
        if (!fastify.circuitBreakerManager) return reply.code(503).send({ error: 'Circuit breaker manager not available' })
        if (!fastify.circuitBreakerManager.has(name)) return reply.code(404).send({ error: `Circuit breaker ${name} not found` })
        logger.info('Reset circuit breaker', { name })
        fastify.circuitBreakerManager.reset(name)
        return reply.code(200).send({
          success: true,
          message: `Circuit breaker ${name} reset`,
          stats: fastify.circuitBreakerManager.getStats(name),
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to reset circuit breaker' }
    )
  })

  fastify.post('/api/admin/circuit-breakers/reset-all', { preHandler: adminOnlyMiddleware }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        if (!fastify.circuitBreakerManager) return reply.code(503).send({ error: 'Circuit breaker manager not available' })
        logger.info('Reset all circuit breakers')
        fastify.circuitBreakerManager.reset()
        return reply.code(200).send({
          success: true,
          message: 'All circuit breakers reset',
          ...fastify.circuitBreakerManager.getAllStats(),
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to reset all circuit breakers' }
    )
  })
}
