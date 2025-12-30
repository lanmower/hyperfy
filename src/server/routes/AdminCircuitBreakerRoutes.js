/* AdminCircuitBreakerRoutes: Admin endpoints for circuit breaker management */
import { AdminRouteBuilder } from '../utils/api/AdminRouteBuilder.js'

const builder = new AdminRouteBuilder('Routes.Admin.CircuitBreaker')

export function registerAdminCircuitBreakerRoutes(fastify) {
  builder.createGetRoute(fastify, '/api/admin/circuit-breakers', async (request, reply, fastify) => {
    if (!fastify.circuitBreakerManager) return reply.code(503).send({ error: 'Circuit breaker manager not available' })
    builder.logInfo('Get circuit breaker stats')
    return reply.code(200).send({
      success: true,
      ...fastify.circuitBreakerManager.getAllStats(),
    })
  }, 'get circuit breaker stats')

  builder.createGetRoute(fastify, '/api/admin/circuit-breakers/:name', async (request, reply, fastify) => {
    const { name } = request.params
    if (!fastify.circuitBreakerManager) return reply.code(503).send({ error: 'Circuit breaker manager not available' })
    if (!fastify.circuitBreakerManager.has(name)) return reply.code(404).send({ error: `Circuit breaker ${name} not found` })
    builder.logInfo('Get circuit breaker', { name })
    return reply.code(200).send({
      success: true,
      stats: fastify.circuitBreakerManager.getStats(name),
    })
  }, 'get circuit breaker')

  builder.createPostRoute(fastify, '/api/admin/circuit-breakers/:name/reset', async (request, reply, fastify) => {
    const { name } = request.params
    if (!fastify.circuitBreakerManager) return reply.code(503).send({ error: 'Circuit breaker manager not available' })
    if (!fastify.circuitBreakerManager.has(name)) return reply.code(404).send({ error: `Circuit breaker ${name} not found` })
    builder.logInfo('Reset circuit breaker', { name })
    fastify.circuitBreakerManager.reset(name)
    return reply.code(200).send({
      success: true,
      message: `Circuit breaker ${name} reset`,
      stats: fastify.circuitBreakerManager.getStats(name),
    })
  }, 'reset circuit breaker')

  builder.createPostRoute(fastify, '/api/admin/circuit-breakers/reset-all', async (request, reply, fastify) => {
    if (!fastify.circuitBreakerManager) return reply.code(503).send({ error: 'Circuit breaker manager not available' })
    builder.logInfo('Reset all circuit breakers')
    fastify.circuitBreakerManager.reset()
    return reply.code(200).send({
      success: true,
      message: 'All circuit breakers reset',
      ...fastify.circuitBreakerManager.getAllStats(),
    })
  }, 'reset all circuit breakers')
}
