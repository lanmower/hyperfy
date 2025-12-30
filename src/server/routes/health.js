import { performance } from 'perf_hooks'
import { ComponentLogger } from '../../core/utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('Routes.Health')

export function registerStatusAPI(fastify, world) {
  fastify.get('/api/status', async (request, reply) => {
    const startTime = performance.now()

    try {
      const timeoutManager = fastify.timeoutManager
      const circuitBreakerManager = fastify.circuitBreakerManager
      const rateLimiterManager = fastify.rateLimiterManager

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
      const timeoutManager = fastify.timeoutManager
      const circuitBreakerManager = fastify.circuitBreakerManager
      const rateLimiterManager = fastify.rateLimiterManager

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

export function registerStatusPageRoutes(fastify, statusPageData) {
  fastify.get('/api/status/summary', async (request, reply) => {
    try {
      const summary = statusPageData.getSummary()
      return reply.code(200).send(summary)
    } catch (err) {
      fastify.logger?.error(`Status summary API failed: ${err.message}`)
      return reply.code(500).send({
        error: err.message,
        timestamp: new Date().toISOString(),
      })
    }
  })

  fastify.get('/api/status/services', async (request, reply) => {
    try {
      const services = statusPageData.getServiceHealth()
      return reply.code(200).send({
        services,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      fastify.logger?.error(`Status services API failed: ${err.message}`)
      return reply.code(500).send({
        error: err.message,
        timestamp: new Date().toISOString(),
      })
    }
  })

  fastify.get('/api/status/history', async (request, reply) => {
    try {
      const limit = parseInt(request.query.limit) || 100
      const history = statusPageData.getIncidentHistory(limit)
      return reply.code(200).send({
        history,
        count: history.length,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      fastify.logger?.error(`Status history API failed: ${err.message}`)
      return reply.code(500).send({
        error: err.message,
        timestamp: new Date().toISOString(),
      })
    }
  })

  fastify.get('/status/stream', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })

    const sendUpdate = () => {
      try {
        const status = statusPageData.getSummary()
        reply.raw.write(`data: ${JSON.stringify(status)}\n\n`)
      } catch (err) {
        fastify.logger?.error(`SSE update failed: ${err.message}`)
      }
    }

    sendUpdate()
    const interval = setInterval(sendUpdate, 10000)

    request.raw.on('close', () => {
      clearInterval(interval)
    })
  })

  fastify.get('/status', async (request, reply) => {
    try {
      let htmlPath = path.join(__dirname, '../../build/public/status.html')

      if (!fs.existsSync(htmlPath)) {
        htmlPath = path.join(__dirname, '../../../public/status.html')
      }

      if (!fs.existsSync(htmlPath)) {
        return reply.code(404).send({
          error: 'Status page not found',
          timestamp: new Date().toISOString(),
        })
      }

      const html = fs.readFileSync(htmlPath, 'utf-8')
      return reply.type('text/html').send(html)
    } catch (err) {
      fastify.logger?.error(`Status page failed: ${err.message}`)
      return reply.code(500).send({
        error: err.message,
        timestamp: new Date().toISOString(),
      })
    }
  })
}
