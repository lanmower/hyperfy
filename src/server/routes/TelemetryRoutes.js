export function registerTelemetryRoutes(fastify, logger) {
  fastify.get('/api/telemetry/stats', async (request, reply) => {
    try {
      if (!fastify.telemetry) {
        return reply.code(503).send({
          error: 'Telemetry not configured',
          timestamp: new Date().toISOString(),
        })
      }

      const stats = fastify.telemetry.getStats()
      return reply.code(200).send(stats)
    } catch (err) {
      logger?.error(`Failed to get telemetry stats: ${err.message}`)
      return reply.code(500).send({
        error: err.message,
        timestamp: new Date().toISOString(),
      })
    }
  })

  fastify.post('/api/telemetry/export', async (request, reply) => {
    try {
      if (!fastify.telemetry) {
        return reply.code(503).send({
          error: 'Telemetry not configured',
          timestamp: new Date().toISOString(),
        })
      }

      const data = fastify.telemetry.exportData()
      return reply.code(200).send(data)
    } catch (err) {
      logger?.error(`Failed to export telemetry: ${err.message}`)
      return reply.code(500).send({
        error: err.message,
        timestamp: new Date().toISOString(),
      })
    }
  })

  fastify.get('/api/telemetry/health', async (request, reply) => {
    try {
      if (!fastify.telemetry) {
        return reply.code(503).send({
          status: 'disabled',
          timestamp: new Date().toISOString(),
        })
      }

      const stats = fastify.telemetry.getStats()
      const healthy = stats.enabled && stats.uptime > 0

      return reply.code(healthy ? 200 : 503).send({
        status: healthy ? 'healthy' : 'unhealthy',
        enabled: stats.enabled,
        uptime: stats.uptime,
        batchSize: stats.batchSize,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      logger?.error(`Telemetry health check failed: ${err.message}`)
      return reply.code(500).send({
        status: 'error',
        error: err.message,
        timestamp: new Date().toISOString(),
      })
    }
  })

  fastify.post('/api/telemetry/reset', async (request, reply) => {
    try {
      if (!fastify.telemetry) {
        return reply.code(503).send({
          error: 'Telemetry not configured',
          timestamp: new Date().toISOString(),
        })
      }

      fastify.telemetry.reset()
      return reply.code(200).send({
        success: true,
        message: 'Telemetry metrics reset',
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      logger?.error(`Failed to reset telemetry: ${err.message}`)
      return reply.code(500).send({
        error: err.message,
        timestamp: new Date().toISOString(),
      })
    }
  })
}
