import { AdminRouteBuilder } from '../utils/api/index.js'
import { addToWhitelist, removeFromWhitelist, addToBlacklist, removeFromBlacklist, getWhitelist, getBlacklist } from '../config/RateLimitConfig.js'
import { getRateLimitStats, clearRateLimitForIP } from '../middleware/RateLimiter.js'

const builder = new AdminRouteBuilder('Routes.Admin.RateLimit')

export function registerAdminRateLimitRoutes(fastify) {
  builder.createStatsRoute(fastify, '/api/admin/rate-limits', async (fastify) => {
    builder.logInfo('Get rate limit stats')
    return { stats: getRateLimitStats(), whitelist: getWhitelist(), blacklist: getBlacklist() }
  }, 'get rate limit stats')

  builder.createPostRoute(fastify, '/api/admin/rate-limits/clear/:ip', async (request, reply, fastify) => {
    const { ip } = request.params
    if (builder.validateRequired(reply, ip, 'IP')) return
    builder.logInfo('Clear rate limit', { ip })
    return reply.code(200).send({ success: true, ip, cleared: clearRateLimitForIP(ip) })
  }, 'clear rate limit')

  builder.createPostRoute(fastify, '/api/admin/rate-limits/whitelist', async (request, reply, fastify) => {
    const { ip } = request.body
    if (builder.validateRequired(reply, ip, 'IP')) return
    builder.logInfo('Add to whitelist', { ip })
    return reply.code(200).send({ success: true, ip, added: addToWhitelist(ip) })
  }, 'add to whitelist')

  builder.createDeleteRoute(fastify, '/api/admin/rate-limits/whitelist/:ip', async (request, reply, fastify) => {
    const { ip } = request.params
    if (builder.validateRequired(reply, ip, 'IP')) return
    builder.logInfo('Remove from whitelist', { ip })
    return reply.code(200).send({ success: true, ip, removed: removeFromWhitelist(ip) })
  }, 'remove from whitelist')

  builder.createPostRoute(fastify, '/api/admin/rate-limits/blacklist', async (request, reply, fastify) => {
    const { ip } = request.body
    if (builder.validateRequired(reply, ip, 'IP')) return
    builder.logInfo('Add to blacklist', { ip })
    return reply.code(200).send({ success: true, ip, added: addToBlacklist(ip) })
  }, 'add to blacklist')

  builder.createDeleteRoute(fastify, '/api/admin/rate-limits/blacklist/:ip', async (request, reply, fastify) => {
    const { ip } = request.params
    if (builder.validateRequired(reply, ip, 'IP')) return
    builder.logInfo('Remove from blacklist', { ip })
    return reply.code(200).send({ success: true, ip, removed: removeFromBlacklist(ip) })
  }, 'remove from blacklist')
}
