import { ComponentLogger } from '../utils/logging/ComponentLogger.js'
import { APIMethodWrapper } from '../utils/api/APIMethodWrapper.js'
import { TimeoutConfig } from '../config/TimeoutConfig.js'

const routeLogger = new ComponentLogger('HealthRoutes')

function timestamp() {
  return new Date().toISOString()
}

function getUptime() {
  return Math.round((Date.now() - (global.SERVER_START_TIME || Date.now())) / 1000)
}

function getMemory() {
  const mem = process.memoryUsage()
  return {
    rss: Math.round(mem.rss / 1024 / 1024),
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
  }
}

export function registerHealthRoutes(fastify, world, logger, errorTracker, aiProviderHealth, circuitBreakerManager, degradationManager, db = null) {
  const log = logger || routeLogger

  fastify.get('/health', async (request, reply) => {
    return APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const isShuttingDown = fastify.shutdownManager?.isShuttingDown || false

        if (isShuttingDown) {
          const shutdownMetrics = fastify.shutdownManager?.getMetrics() || {}
          return reply.code(503).send({
            status: 'shutting_down',
            message: 'Server is shutting down',
            shutdown: shutdownMetrics,
            timestamp: timestamp(),
          })
        }

        const providerStatus = aiProviderHealth ? aiProviderHealth.getAllStatus() : {}
        const hasUnhealthyProvider = Object.values(providerStatus).some(p => p.status === 'DOWN')

        const circuitBreakerStats = circuitBreakerManager ? circuitBreakerManager.getAllStats() : null
        const hasOpenCircuit = circuitBreakerStats && circuitBreakerStats.summary.open > 0

        const degradationStatus = degradationManager ? degradationManager.getStats() : null
        const isDegraded = degradationStatus && degradationStatus.mode !== 'NORMAL'

        const corsStats = fastify.corsConfig ? {
          rejectedRequests: fastify.corsConfig.rejectedRequests.length,
          acceptedRequests: fastify.corsConfig.acceptedRequests.length,
        } : null

        const health = {
          status: isDegraded ? 'degraded' : hasOpenCircuit ? 'degraded' : hasUnhealthyProvider ? 'degraded' : 'up',
          uptime: getUptime(),
          timestamp: timestamp(),
          memory: getMemory(),
          providers: providerStatus,
          circuitBreakers: circuitBreakerStats,
          degradation: degradationStatus,
          cors: corsStats,
        }

        return reply.code(200).send(health)
      },
      reply,
      { logger: log, defaultStatusCode: 503 }
    )
  })

  fastify.get('/health/ready', async (request, reply) => {
    return APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const isShuttingDown = fastify.shutdownManager?.isShuttingDown || false

        if (isShuttingDown) {
          return reply.code(503).send({
            ready: false,
            message: 'Server is shutting down',
            timestamp: timestamp(),
          })
        }

        const checks = {
          world: world && world.entities ? true : false,
          network: world?.network ? true : false,
          storage: true,
        }

        const ready = Object.values(checks).every(v => v === true)
        const statusCode = ready ? 200 : 503

        return reply.code(statusCode).send({
          ready,
          checks,
          timestamp: timestamp(),
        })
      },
      reply,
      { logger: log, defaultStatusCode: 503 }
    )
  })

  fastify.get('/health/live', async (request, reply) => {
    return APIMethodWrapper.wrapFastifyMethod(
      async () => {
        return reply.code(200).send({
          status: 'alive',
          timestamp: timestamp(),
        })
      },
      reply,
      { logger: log, defaultStatusCode: 503 }
    )
  })

  fastify.get('/metrics', async (request, reply) => {
    return APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const stats = errorTracker?.getStats() || {}

        const metrics = {
          uptime: getUptime(),
          memory: getMemory(),
          errors: stats.totalErrors || 0,
          errorsByLevel: stats.byLevel || {},
          errorsByCategory: stats.byCategory || {},
          connections: world?.network?.sockets?.size || 0,
          entities: world?.entities?.list?.length || 0,
          blueprints: world?.blueprints?.list?.length || 0,
          apps: world?.apps?.list?.length || 0,
        }

        if (fastify.metrics) {
          const metricsStats = fastify.metrics.getStats()
          metrics.systemMetrics = metricsStats
        }

        if (circuitBreakerManager) {
          const cbStats = circuitBreakerManager.getAllStats()
          metrics.circuitBreakers = cbStats
        }

        return reply.code(200).send(metrics)
      },
      reply,
      { logger: log, defaultStatusCode: 500 }
    )
  })

  fastify.get('/health/providers', async (request, reply) => {
    return APIMethodWrapper.wrapFastifyMethod(
      async () => {
        if (!aiProviderHealth) {
          return reply.code(503).send({
            error: 'AI provider health monitoring not configured',
            timestamp: timestamp(),
          })
        }

        const status = aiProviderHealth.getAllStatus()
        const healthy = Object.values(status).filter(p => p.status === 'UP').length
        const degraded = Object.values(status).filter(p => p.status === 'DEGRADED').length
        const down = Object.values(status).filter(p => p.status === 'DOWN').length

        return reply.code(200).send({
          summary: {
            total: Object.keys(status).length,
            healthy,
            degraded,
            down,
          },
          providers: status,
          timestamp: timestamp(),
        })
      },
      reply,
      { logger: log, defaultStatusCode: 500 }
    )
  })

  fastify.get('/health/telemetry', async (request, reply) => {
    return APIMethodWrapper.wrapFastifyMethod(
      async () => {
        if (!fastify.telemetry) {
          return reply.code(503).send({
            error: 'Telemetry not configured',
            timestamp: timestamp(),
          })
        }

        const stats = fastify.telemetry.getStats()
        return reply.code(200).send(stats)
      },
      reply,
      { logger: log, defaultStatusCode: 500 }
    )
  })

  fastify.get('/health/circuit-breakers', async (request, reply) => {
    return APIMethodWrapper.wrapFastifyMethod(
      async () => {
        if (!circuitBreakerManager) {
          return reply.code(503).send({
            error: 'Circuit breaker manager not configured',
            timestamp: timestamp(),
          })
        }

        const stats = circuitBreakerManager.getAllStats()
        return reply.code(200).send({
          ...stats,
          timestamp: timestamp(),
        })
      },
      reply,
      { logger: log, defaultStatusCode: 500 }
    )
  })

  fastify.get('/health/degradation', async (request, reply) => {
    return APIMethodWrapper.wrapFastifyMethod(
      async () => {
        if (!degradationManager) {
          return reply.code(503).send({
            error: 'Degradation manager not configured',
            timestamp: timestamp(),
          })
        }

        const status = degradationManager.getAllStatus()
        return reply.code(200).send({
          ...status,
          timestamp: timestamp(),
        })
      },
      reply,
      { logger: log, defaultStatusCode: 500 }
    )
  })

  fastify.get('/health/database', async (request, reply) => {
    return APIMethodWrapper.wrapFastifyMethod(
      async () => {
        if (!db) {
          return reply.code(503).send({
            error: 'Database not configured',
            timestamp: timestamp(),
          })
        }

        const metrics = db.metrics ? db.metrics.getMetrics() : null
        const cacheStats = db.queryCache ? db.queryCache.getStats() : null

        return reply.code(200).send({
          metrics,
          cache: cacheStats,
          timestamp: timestamp(),
        })
      },
      reply,
      { logger: log, defaultStatusCode: 500 }
    )
  })

  fastify.get('/health/cors', async (request, reply) => {
    return APIMethodWrapper.wrapFastifyMethod(
      async () => {
        if (!fastify.corsConfig) {
          return reply.code(503).send({
            error: 'CORS config not configured',
            timestamp: timestamp(),
          })
        }

        const stats = fastify.corsConfig.getStats()

        return reply.code(200).send({
          ...stats,
          timestamp: timestamp(),
        })
      },
      reply,
      { logger: log, defaultStatusCode: 500 }
    )
  })
}
