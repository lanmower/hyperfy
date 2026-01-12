import { AdminRouteBuilder } from '../utils/api/index.js'

const builder = new AdminRouteBuilder('Routes.Admin.Degradation')

export function registerAdminDegradationRoutes(fastify) {
  builder.createStatsRoute(fastify, '/api/admin/degradation', async (fastify) => {
    if (!fastify.degradationManager) throw new Error('Degradation manager not available')
    builder.logInfo('Get degradation status')
    return {
      ...fastify.degradationManager.getAllStatus(),
      stats: fastify.degradationManager.getStats(),
    }
  }, 'get degradation status')

  builder.createGetRoute(fastify, '/api/admin/degradation/:service', async (request, reply, fastify) => {
    const { service } = request.params
    if (builder.ensureManager(reply, fastify.degradationManager, 'Degradation manager')) return
    builder.logInfo('Get service degradation status', { service })
    return reply.code(200).send({
      success: true,
      service: fastify.degradationManager.getServiceStatus(service),
    })
  }, 'get service degradation status')

  builder.createPostRoute(fastify, '/api/admin/degradation/force-mode', async (request, reply, fastify) => {
    const { mode, reason } = request.body
    if (builder.validateRequired(reply, mode, 'Mode')) return
    if (builder.ensureManager(reply, fastify.degradationManager, 'Degradation manager')) return
    builder.logInfo('Force degradation mode', { mode })
    return reply.code(200).send({
      success: true,
      ...fastify.degradationManager.forceMode(mode, reason || 'Admin override'),
      status: fastify.degradationManager.getAllStatus(),
    })
  }, 'force degradation mode')
}
