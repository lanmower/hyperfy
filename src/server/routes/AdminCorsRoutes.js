import { AdminRouteBuilder } from '../utils/api/index.js'

const builder = new AdminRouteBuilder('Routes.Admin.Cors')

export function registerAdminCorsRoutes(fastify) {
  builder.createStatsRoute(fastify, '/api/admin/cors', async (fastify) => {
    if (!fastify.corsConfig) throw new Error('CORS config not available')
    builder.logInfo('Get CORS config')
    return { config: fastify.corsConfig.getConfig(), stats: fastify.corsConfig.getStats() }
  }, 'get CORS config')

  builder.createPostRoute(fastify, '/api/admin/cors/origin', async (request, reply, fastify) => {
    const { origin } = request.body
    if (builder.validateRequired(reply, origin, 'Origin')) return
    if (builder.ensureManager(reply, fastify.corsConfig, 'CORS config')) return
    builder.logInfo('Add CORS origin', { origin })
    return reply.code(200).send({ success: true, origin, added: fastify.corsConfig.addOrigin(origin) })
  }, 'add CORS origin')

  builder.createDeleteRoute(fastify, '/api/admin/cors/origin', async (request, reply, fastify) => {
    const { origin } = request.body
    if (builder.validateRequired(reply, origin, 'Origin')) return
    if (builder.ensureManager(reply, fastify.corsConfig, 'CORS config')) return
    builder.logInfo('Remove CORS origin', { origin })
    return reply.code(200).send({ success: true, origin, removed: fastify.corsConfig.removeOrigin(origin) })
  }, 'remove CORS origin')
}
