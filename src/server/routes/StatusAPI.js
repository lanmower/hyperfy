import { performance } from 'perf_hooks'
import { ComponentLogger } from '../../core/utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('StatusAPI')

export function registerStatusAPI(fastify, { world, timeoutManager, circuitBreakerManager, rateLimiterManager }) {
  fastify.get('/api/status', async (request, reply) => {
    const startTime = performance.now()

    try {
      const status = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        world: {
          frame: world.frame,
          time: world.time,
          entities: world.entities?.items?.size || 0,
          players: world.players?.items?.size || 0,
        },
        performance: world.performanceMonitor?.getMetrics() || {},
        circuits: circuitBreakerManager?.getStats() || {},
        timeouts: timeoutManager?.getStats() || {},
        rateLimits: rateLimiterManager?.getStats() || {},
        health: {
          status: 'healthy',
          checks: {
            database: true,
            network: world.network?.connected || false,
            memory: process.memoryUsage().heapUsed < 1024 * 1024 * 1024,
          }
        }
      }

      const duration = performance.now() - startTime
      logger.info('Status request', { duration: `${duration.toFixed(2)}ms` })

      reply.send(status)
    } catch (error) {
      logger.error('Status request failed', { error: error.message })
      reply.status(500).send({ error: 'Failed to get status' })
    }
  })

  fastify.get('/api/health', async (request, reply) => {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
          database: true,
          network: world.network?.connected || false,
          memory: process.memoryUsage().heapUsed < 1024 * 1024 * 1024,
        }
      }

      reply.send(health)
    } catch (error) {
      reply.status(500).send({ status: 'unhealthy', error: error.message })
    }
  })

  fastify.get('/api/metrics', async (request, reply) => {
    try {
      const metrics = {
        performance: world.performanceMonitor?.getMetrics() || {},
        memory: process.memoryUsage(),
        circuits: circuitBreakerManager?.getStats() || {},
        timeouts: timeoutManager?.getStats() || {},
        rateLimits: rateLimiterManager?.getStats() || {},
      }

      reply.send(metrics)
    } catch (error) {
      reply.status(500).send({ error: error.message })
    }
  })
}
