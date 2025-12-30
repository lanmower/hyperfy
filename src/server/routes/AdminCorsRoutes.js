/* AdminCorsRoutes: Admin endpoints for CORS configuration */
import { AdminRouteBuilder } from '../utils/api/AdminRouteBuilder.js'

const builder = new AdminRouteBuilder('Routes.Admin.Cors')

export function registerAdminCorsRoutes(fastify) {
  builder.createGetRoute(fastify, '/api/admin/cors', async (request, reply, fastify) => {
    if (!fastify.corsConfig) return reply.code(503).send({ error: 'CORS config not available' })
    builder.logInfo('Get CORS config')
    return reply.code(200).send({
      success: true,
      config: fastify.corsConfig.getConfig(),
      stats: fastify.corsConfig.getStats(),
    })
  }, 'get CORS config')

  builder.createPostRoute(fastify, '/api/admin/cors/origin', async (request, reply, fastify) => {
    const { origin } = request.body
    if (!origin) return reply.code(400).send({ error: 'Origin is required' })
    if (!fastify.corsConfig) return reply.code(503).send({ error: 'CORS config not available' })
    builder.logInfo('Add CORS origin', { origin })
    return reply.code(200).send({
      success: true,
      origin,
      added: fastify.corsConfig.addOrigin(origin),
    })
  }, 'add CORS origin')

  builder.createDeleteRoute(fastify, '/api/admin/cors/origin', async (request, reply, fastify) => {
    const { origin } = request.body
    if (!origin) return reply.code(400).send({ error: 'Origin is required' })
    if (!fastify.corsConfig) return reply.code(503).send({ error: 'CORS config not available' })
    builder.logInfo('Remove CORS origin', { origin })
    return reply.code(200).send({
      success: true,
      origin,
      removed: fastify.corsConfig.removeOrigin(origin),
    })
  }, 'remove CORS origin')
}
