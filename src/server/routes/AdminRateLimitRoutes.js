import { addToWhitelist, removeFromWhitelist, addToBlacklist, removeFromBlacklist, getWhitelist, getBlacklist } from '../config/RateLimitConfig.js'
import { adminOnlyMiddleware } from '../middleware/authMiddleware.js'
import { ComponentLogger } from '../../core/utils/logging/ComponentLogger.js'
import { APIMethodWrapper } from '../utils/api/APIMethodWrapper.js'
import { getRateLimitStats, clearRateLimitForIP } from '../middleware/RateLimiter.js'

const logger = new ComponentLogger('Routes.Admin.RateLimit')

export function registerAdminRateLimitRoutes(fastify) {
  fastify.get('/api/admin/rate-limits', { preHandler: adminOnlyMiddleware }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        logger.info('Get rate limit stats')
        return reply.code(200).send({
          success: true,
          stats: getRateLimitStats(),
          whitelist: getWhitelist(),
          blacklist: getBlacklist(),
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to get rate limit stats' }
    )
  })

  fastify.post('/api/admin/rate-limits/clear/:ip', { preHandler: adminOnlyMiddleware }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { ip } = req.params
        logger.info('Clear rate limit', { ip })
        return reply.code(200).send({
          success: true,
          ip,
          cleared: clearRateLimitForIP(ip),
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to clear rate limit' }
    )
  })

  fastify.post('/api/admin/rate-limits/whitelist', { preHandler: adminOnlyMiddleware }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { ip } = req.body
        if (!ip) return reply.code(400).send({ error: 'IP address required' })
        logger.info('Add to whitelist', { ip })
        return reply.code(200).send({
          success: true,
          ip,
          added: addToWhitelist(ip),
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to add to whitelist' }
    )
  })

  fastify.delete('/api/admin/rate-limits/whitelist/:ip', { preHandler: adminOnlyMiddleware }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { ip } = req.params
        logger.info('Remove from whitelist', { ip })
        return reply.code(200).send({
          success: true,
          ip,
          removed: removeFromWhitelist(ip),
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to remove from whitelist' }
    )
  })

  fastify.post('/api/admin/rate-limits/blacklist', { preHandler: adminOnlyMiddleware }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { ip } = req.body
        if (!ip) return reply.code(400).send({ error: 'IP address required' })
        logger.info('Add to blacklist', { ip })
        return reply.code(200).send({
          success: true,
          ip,
          added: addToBlacklist(ip),
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to add to blacklist' }
    )
  })

  fastify.delete('/api/admin/rate-limits/blacklist/:ip', { preHandler: adminOnlyMiddleware }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { ip } = req.params
        logger.info('Remove from blacklist', { ip })
        return reply.code(200).send({
          success: true,
          ip,
          removed: removeFromBlacklist(ip),
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to remove from blacklist' }
    )
  })
}
