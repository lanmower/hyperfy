/* AdminDegradationRoutes: Admin endpoints for service degradation management */
import { AdminRouteBuilder } from '../utils/api/AdminRouteBuilder.js'

const builder = new AdminRouteBuilder('Routes.Admin.Degradation')

export function registerAdminDegradationRoutes(fastify) {
  builder.createGetRoute(fastify, '/api/admin/degradation', async (request, reply, fastify) => {
    if (!fastify.degradationManager) return reply.code(503).send({ error: 'Degradation manager not available' })
    builder.logInfo('Get degradation status')
    return reply.code(200).send({
      success: true,
      ...fastify.degradationManager.getAllStatus(),
      stats: fastify.degradationManager.getStats(),
    })
  }, 'get degradation status')

  builder.createGetRoute(fastify, '/api/admin/degradation/:service', async (request, reply, fastify) => {
    const { service } = request.params
    if (!fastify.degradationManager) return reply.code(503).send({ error: 'Degradation manager not available' })
    builder.logInfo('Get service degradation status', { service })
    return reply.code(200).send({
      success: true,
      service: fastify.degradationManager.getServiceStatus(service),
    })
  }, 'get service degradation status')

  builder.createPostRoute(fastify, '/api/admin/degradation/force-mode', async (request, reply, fastify) => {
    const { mode, reason } = request.body
    if (!mode) return reply.code(400).send({ error: 'Mode is required' })
    if (!fastify.degradationManager) return reply.code(503).send({ error: 'Degradation manager not available' })
    builder.logInfo('Force degradation mode', { mode })
    return reply.code(200).send({
      success: true,
      ...fastify.degradationManager.forceMode(mode, reason || 'Admin override'),
      status: fastify.degradationManager.getAllStatus(),
    })
  }, 'force degradation mode')
}
