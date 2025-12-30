import {
  addToWhitelist,
  removeFromWhitelist,
  addToBlacklist,
  removeFromBlacklist,
  getWhitelist,
  getBlacklist,
} from '../config/RateLimitConfig.js'
import { adminOnlyMiddleware } from '../middleware/authMiddleware.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'
import { APIMethodWrapper } from '../utils/api/APIMethodWrapper.js'
import { getRateLimitStats, clearRateLimitForIP } from '../middleware/RateLimiter.js'

const logger = new ComponentLogger('Routes.Admin')

export function registerAdminRoutes(fastify) {
  fastify.get('/api/admin/rate-limits', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        logger.info('Get rate limit stats')
        const stats = getRateLimitStats()
        const whitelist = getWhitelist()
        const blacklist = getBlacklist()

        return reply.code(200).send({
          success: true,
          stats,
          whitelist,
          blacklist,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to get rate limit stats' }
    )
  })

  fastify.post('/api/admin/rate-limits/clear/:ip', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { ip } = req.params
        logger.info('Clear rate limit', { ip })
        const cleared = clearRateLimitForIP(ip)

        return reply.code(200).send({
          success: true,
          ip,
          cleared,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to clear rate limit' }
    )
  })

  fastify.post('/api/admin/rate-limits/whitelist', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { ip } = req.body

        if (!ip) {
          return reply.code(400).send({ error: 'IP address required' })
        }

        logger.info('Add to whitelist', { ip })
        const result = addToWhitelist(ip)

        return reply.code(200).send({
          success: true,
          ip,
          added: result,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to add to whitelist' }
    )
  })

  fastify.delete('/api/admin/rate-limits/whitelist/:ip', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { ip } = req.params
        logger.info('Remove from whitelist', { ip })
        const result = removeFromWhitelist(ip)

        return reply.code(200).send({
          success: true,
          ip,
          removed: result,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to remove from whitelist' }
    )
  })

  fastify.post('/api/admin/rate-limits/blacklist', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { ip } = req.body

        if (!ip) {
          return reply.code(400).send({ error: 'IP address required' })
        }

        logger.info('Add to blacklist', { ip })
        const result = addToBlacklist(ip)

        return reply.code(200).send({
          success: true,
          ip,
          added: result,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to add to blacklist' }
    )
  })

  fastify.delete('/api/admin/rate-limits/blacklist/:ip', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { ip } = req.params
        logger.info('Remove from blacklist', { ip })
        const result = removeFromBlacklist(ip)

        return reply.code(200).send({
          success: true,
          ip,
          removed: result,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to remove from blacklist' }
    )
  })

  fastify.get('/api/admin/circuit-breakers', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        if (!fastify.circuitBreakerManager) {
          return reply.code(503).send({ error: 'Circuit breaker manager not available' })
        }

        logger.info('Get circuit breaker stats')
        const stats = fastify.circuitBreakerManager.getAllStats()
        return reply.code(200).send({
          success: true,
          ...stats,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to get circuit breaker stats' }
    )
  })

  fastify.get('/api/admin/circuit-breakers/:name', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { name } = req.params

        if (!fastify.circuitBreakerManager) {
          return reply.code(503).send({ error: 'Circuit breaker manager not available' })
        }

        if (!fastify.circuitBreakerManager.has(name)) {
          return reply.code(404).send({ error: `Circuit breaker ${name} not found` })
        }

        logger.info('Get circuit breaker', { name })
        const stats = fastify.circuitBreakerManager.getStats(name)
        return reply.code(200).send({
          success: true,
          stats,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to get circuit breaker' }
    )
  })

  fastify.post('/api/admin/circuit-breakers/:name/reset', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { name } = req.params

        if (!fastify.circuitBreakerManager) {
          return reply.code(503).send({ error: 'Circuit breaker manager not available' })
        }

        if (!fastify.circuitBreakerManager.has(name)) {
          return reply.code(404).send({ error: `Circuit breaker ${name} not found` })
        }

        logger.info('Reset circuit breaker', { name })
        fastify.circuitBreakerManager.reset(name)
        const stats = fastify.circuitBreakerManager.getStats(name)

        return reply.code(200).send({
          success: true,
          message: `Circuit breaker ${name} reset`,
          stats,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to reset circuit breaker' }
    )
  })

  fastify.post('/api/admin/circuit-breakers/reset-all', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        if (!fastify.circuitBreakerManager) {
          return reply.code(503).send({ error: 'Circuit breaker manager not available' })
        }

        logger.info('Reset all circuit breakers')
        fastify.circuitBreakerManager.reset()
        const stats = fastify.circuitBreakerManager.getAllStats()

        return reply.code(200).send({
          success: true,
          message: 'All circuit breakers reset',
          ...stats,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to reset all circuit breakers' }
    )
  })

  fastify.get('/api/admin/degradation', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        if (!fastify.degradationManager) {
          return reply.code(503).send({ error: 'Degradation manager not available' })
        }

        logger.info('Get degradation status')
        const status = fastify.degradationManager.getAllStatus()
        const stats = fastify.degradationManager.getStats()

        return reply.code(200).send({
          success: true,
          ...status,
          stats,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to get degradation status' }
    )
  })

  fastify.get('/api/admin/degradation/:service', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { service } = req.params

        if (!fastify.degradationManager) {
          return reply.code(503).send({ error: 'Degradation manager not available' })
        }

        logger.info('Get service degradation status', { service })
        const status = fastify.degradationManager.getServiceStatus(service)

        return reply.code(200).send({
          success: true,
          service: status,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to get service degradation status' }
    )
  })

  fastify.post('/api/admin/degradation/force-mode', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { mode, reason } = req.body

        if (!mode) {
          return reply.code(400).send({ error: 'Mode is required' })
        }

        if (!fastify.degradationManager) {
          return reply.code(503).send({ error: 'Degradation manager not available' })
        }

        logger.info('Force degradation mode', { mode })
        const result = fastify.degradationManager.forceMode(mode, reason || 'Admin override')
        const status = fastify.degradationManager.getAllStatus()

        return reply.code(200).send({
          success: true,
          ...result,
          status,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to force degradation mode' }
    )
  })

  fastify.get('/api/admin/cors', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        if (!fastify.corsConfig) {
          return reply.code(503).send({ error: 'CORS config not available' })
        }

        logger.info('Get CORS config')
        const config = fastify.corsConfig.getConfig()
        const stats = fastify.corsConfig.getStats()

        return reply.code(200).send({
          success: true,
          config,
          stats,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to get CORS config' }
    )
  })

  fastify.post('/api/admin/cors/origin', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { origin } = req.body

        if (!origin) {
          return reply.code(400).send({ error: 'Origin is required' })
        }

        if (!fastify.corsConfig) {
          return reply.code(503).send({ error: 'CORS config not available' })
        }

        logger.info('Add CORS origin', { origin })
        const added = fastify.corsConfig.addOrigin(origin)

        return reply.code(200).send({
          success: true,
          origin,
          added,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to add CORS origin' }
    )
  })

  fastify.delete('/api/admin/cors/origin', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { origin } = req.body

        if (!origin) {
          return reply.code(400).send({ error: 'Origin is required' })
        }

        if (!fastify.corsConfig) {
          return reply.code(503).send({ error: 'CORS config not available' })
        }

        logger.info('Remove CORS origin', { origin })
        const removed = fastify.corsConfig.removeOrigin(origin)

        return reply.code(200).send({
          success: true,
          origin,
          removed,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to remove CORS origin' }
    )
  })
}
