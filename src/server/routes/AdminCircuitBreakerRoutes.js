import { AdminRouteBuilder } from '../utils/api/index.js'

const builder = new AdminRouteBuilder('Routes.Admin.CircuitBreaker')

export function registerAdminCircuitBreakerRoutes(fastify) {
  builder.createStatsRoute(fastify, '/api/admin/circuit-breakers', async (fastify) => {
    if (!fastify.circuitBreakerManager) throw new Error('Circuit breaker manager not available')
    builder.logInfo('Get circuit breaker stats')
    return fastify.circuitBreakerManager.getAllStats()
  }, 'get circuit breaker stats')

  builder.createGetRoute(fastify, '/api/admin/circuit-breakers/:name', async (request, reply, fastify) => {
    const { name } = request.params
    if (builder.ensureManager(reply, fastify.circuitBreakerManager, 'Circuit breaker manager')) return
    if (builder.validateRequired(reply, fastify.circuitBreakerManager.has(name), 'Circuit breaker')) return
    builder.logInfo('Get circuit breaker', { name })
    return reply.code(200).send({
      success: true,
      stats: fastify.circuitBreakerManager.getStats(name),
    })
  }, 'get circuit breaker')

  builder.createResetRoute(fastify, '/api/admin/circuit-breakers/:name/reset', async (fastify, name) => {
    if (!fastify.circuitBreakerManager) throw new Error('Circuit breaker manager not available')
    if (!fastify.circuitBreakerManager.has(name)) throw new Error(`Circuit breaker ${name} not found`)
    builder.logInfo('Reset circuit breaker', { name })
    fastify.circuitBreakerManager.reset(name)
    return {
      message: `Circuit breaker ${name} reset`,
      stats: fastify.circuitBreakerManager.getStats(name),
    }
  }, 'reset circuit breaker')

  builder.createPostRoute(fastify, '/api/admin/circuit-breakers/reset-all', async (request, reply, fastify) => {
    if (builder.ensureManager(reply, fastify.circuitBreakerManager, 'Circuit breaker manager')) return
    builder.logInfo('Reset all circuit breakers')
    fastify.circuitBreakerManager.reset()
    return reply.code(200).send({
      success: true,
      message: 'All circuit breakers reset',
      ...fastify.circuitBreakerManager.getAllStats(),
    })
  }, 'reset all circuit breakers')
}
