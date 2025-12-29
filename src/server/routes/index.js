import path from 'path'
import fs from 'fs-extra'
import { fileURLToPath } from 'url'
import { performance } from 'perf_hooks'
import { hashFile } from '../../core/utils.js'
import { createRateLimiter, getRateLimitStats, clearRateLimitForIP } from '../middleware/RateLimiter.js'
import { adminOnlyMiddleware } from '../middleware/authMiddleware.js'
import {
  addToWhitelist,
  removeFromWhitelist,
  addToBlacklist,
  removeFromBlacklist,
  getWhitelist,
  getBlacklist,
} from '../config/RateLimitConfig.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'
import { APIMethodWrapper } from '../utils/api/APIMethodWrapper.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const logger = new ComponentLogger('Routes')

const MAX_UPLOAD_SIZE = 50 * 1024 * 1024
const BLOCKED_EXTENSIONS = new Set(['exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js'])

export function registerRoutes(fastify, world, assetsDir) {
  registerUploadRoutes(fastify, assetsDir)
  registerStatusAPI(fastify, world)
  registerStatusPageRoutes(fastify, fastify.statusPageData)
  registerAdminRoutes(fastify)
}

function registerUploadRoutes(fastify, assetsDir) {
  fastify.post('/api/upload', {
    preHandler: createRateLimiter('upload'),
  }, async (req, reply) => {
    const timeoutManager = fastify.timeoutManager
    const circuitBreakerManager = fastify.circuitBreakerManager
    const uploadTimeout = timeoutManager ? timeoutManager.getTimeout('upload') : 120000

    const executeUpload = async () => {
      const filePromise = req.file()
      const file = await (timeoutManager
        ? timeoutManager.wrapPromise(filePromise, uploadTimeout, 'upload', 'file-upload')
        : filePromise)
      if (!file) {
        throw new Error('No file provided')
      }

      const ext = file.filename.split('.').pop().toLowerCase()
      if (BLOCKED_EXTENSIONS.has(ext)) {
        throw new Error('File type not allowed')
      }

      const chunks = []
      let totalSize = 0
      for await (const chunk of file.file) {
        totalSize += chunk.length
        if (totalSize > MAX_UPLOAD_SIZE) {
          const error = new Error('File size exceeds maximum allowed')
          error.code = 'FILE_TOO_LARGE'
          throw error
        }
        chunks.push(chunk)
      }

      const buffer = Buffer.concat(chunks)
      const hash = await hashFile(buffer)
      const filename = `${hash}.${ext}`
      const filePath = path.join(assetsDir, filename)

      const exists = await fs.exists(filePath)
      if (!exists) {
        await fs.writeFile(filePath, buffer)
      }

      return { success: true, hash }
    }

    try {
      let result
      if (circuitBreakerManager && circuitBreakerManager.has('upload')) {
        result = await circuitBreakerManager.execute('upload', executeUpload)
      } else {
        result = await executeUpload()
      }
      return reply.code(200).send(result)
    } catch (error) {
      if (error.code === 'CIRCUIT_OPEN') {
        logger.error('Upload circuit breaker open', {})
        return reply.code(503).send({ error: 'Upload service unavailable' })
      }
      if (error.code === 'TIMEOUT') {
        logger.error('Upload timeout', { error: error.message })
        return reply.code(408).send({ error: 'Upload timeout', message: error.message })
      }
      if (error.code === 'FILE_TOO_LARGE') {
        return reply.code(413).send({ error: error.message })
      }
      if (error.message === 'No file provided' || error.message === 'File type not allowed') {
        return reply.code(400).send({ error: error.message })
      }
      logger.error('Upload failed', { error: error.message })
      return reply.code(500).send({ error: 'Upload failed' })
    }
  })

  fastify.get('/api/upload-check', async (req, reply) => {
    try {
      const { hash } = req.query

      if (!hash) {
        return reply.code(400).send({ error: 'Hash parameter required' })
      }

      if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash)) {
        return reply.code(400).send({ error: 'Invalid hash format' })
      }

      const filename = hash.substring(0, 2) + '/' + hash.substring(2)
      const filePath = path.resolve(path.join(assetsDir, filename))

      if (!filePath.startsWith(path.resolve(assetsDir))) {
        return reply.code(400).send({ error: 'Invalid path' })
      }

      const exists = await fs.exists(filePath)
      return reply.code(200).send({ exists })
    } catch (error) {
      logger.error('Upload check failed', { error: error.message })
      return reply.code(500).send({ error: 'Check failed' })
    }
  })
}

function registerStatusAPI(fastify, world) {
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

function registerStatusPageRoutes(fastify, statusPageData) {
  fastify.get('/api/status', async (request, reply) => {
    try {
      const fullStatus = statusPageData.getFullStatus()
      return reply.code(200).send(fullStatus)
    } catch (err) {
      fastify.logger?.error(`Status API failed: ${err.message}`)
      return reply.code(500).send({
        error: err.message,
        timestamp: new Date().toISOString(),
      })
    }
  })

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

function registerAdminRoutes(fastify) {
  fastify.get('/api/admin/rate-limits', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        logger.info('Get rate limit stats')
        const stats = getRateLimitStats()
        const whitelist = getWhitelist()
        const blacklist = getBlacklist()

        return reply.code(200).send({
          success: true,
          stats,
          whitelist,
          blacklist,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to get rate limit stats' }
    )
  })

  fastify.post('/api/admin/rate-limits/clear/:ip', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { ip } = req.params
        logger.info('Clear rate limit', { ip })
        const cleared = clearRateLimitForIP(ip)

        return reply.code(200).send({
          success: true,
          ip,
          cleared,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to clear rate limit' }
    )
  })

  fastify.post('/api/admin/rate-limits/whitelist', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { ip } = req.body

        if (!ip) {
          return reply.code(400).send({ error: 'IP address required' })
        }

        logger.info('Add to whitelist', { ip })
        const result = addToWhitelist(ip)

        return reply.code(200).send({
          success: true,
          ip,
          added: result,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to add to whitelist' }
    )
  })

  fastify.delete('/api/admin/rate-limits/whitelist/:ip', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { ip } = req.params
        logger.info('Remove from whitelist', { ip })
        const result = removeFromWhitelist(ip)

        return reply.code(200).send({
          success: true,
          ip,
          removed: result,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to remove from whitelist' }
    )
  })

  fastify.post('/api/admin/rate-limits/blacklist', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { ip } = req.body

        if (!ip) {
          return reply.code(400).send({ error: 'IP address required' })
        }

        logger.info('Add to blacklist', { ip })
        const result = addToBlacklist(ip)

        return reply.code(200).send({
          success: true,
          ip,
          added: result,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to add to blacklist' }
    )
  })

  fastify.delete('/api/admin/rate-limits/blacklist/:ip', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { ip } = req.params
        logger.info('Remove from blacklist', { ip })
        const result = removeFromBlacklist(ip)

        return reply.code(200).send({
          success: true,
          ip,
          removed: result,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to remove from blacklist' }
    )
  })

  fastify.get('/api/admin/circuit-breakers', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        if (!fastify.circuitBreakerManager) {
          return reply.code(503).send({ error: 'Circuit breaker manager not available' })
        }

        logger.info('Get circuit breaker stats')
        const stats = fastify.circuitBreakerManager.getAllStats()
        return reply.code(200).send({
          success: true,
          ...stats,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to get circuit breaker stats' }
    )
  })

  fastify.get('/api/admin/circuit-breakers/:name', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { name } = req.params

        if (!fastify.circuitBreakerManager) {
          return reply.code(503).send({ error: 'Circuit breaker manager not available' })
        }

        if (!fastify.circuitBreakerManager.has(name)) {
          return reply.code(404).send({ error: `Circuit breaker ${name} not found` })
        }

        logger.info('Get circuit breaker', { name })
        const stats = fastify.circuitBreakerManager.getStats(name)
        return reply.code(200).send({
          success: true,
          stats,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to get circuit breaker' }
    )
  })

  fastify.post('/api/admin/circuit-breakers/:name/reset', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { name } = req.params

        if (!fastify.circuitBreakerManager) {
          return reply.code(503).send({ error: 'Circuit breaker manager not available' })
        }

        if (!fastify.circuitBreakerManager.has(name)) {
          return reply.code(404).send({ error: `Circuit breaker ${name} not found` })
        }

        logger.info('Reset circuit breaker', { name })
        fastify.circuitBreakerManager.reset(name)
        const stats = fastify.circuitBreakerManager.getStats(name)

        return reply.code(200).send({
          success: true,
          message: `Circuit breaker ${name} reset`,
          stats,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to reset circuit breaker' }
    )
  })

  fastify.post('/api/admin/circuit-breakers/reset-all', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        if (!fastify.circuitBreakerManager) {
          return reply.code(503).send({ error: 'Circuit breaker manager not available' })
        }

        logger.info('Reset all circuit breakers')
        fastify.circuitBreakerManager.reset()
        const stats = fastify.circuitBreakerManager.getAllStats()

        return reply.code(200).send({
          success: true,
          message: 'All circuit breakers reset',
          ...stats,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to reset all circuit breakers' }
    )
  })

  fastify.get('/api/admin/degradation', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        if (!fastify.degradationManager) {
          return reply.code(503).send({ error: 'Degradation manager not available' })
        }

        logger.info('Get degradation status')
        const status = fastify.degradationManager.getAllStatus()
        const stats = fastify.degradationManager.getStats()

        return reply.code(200).send({
          success: true,
          ...status,
          stats,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to get degradation status' }
    )
  })

  fastify.get('/api/admin/degradation/:service', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { service } = req.params

        if (!fastify.degradationManager) {
          return reply.code(503).send({ error: 'Degradation manager not available' })
        }

        logger.info('Get service degradation status', { service })
        const status = fastify.degradationManager.getServiceStatus(service)

        return reply.code(200).send({
          success: true,
          service: status,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to get service degradation status' }
    )
  })

  fastify.post('/api/admin/degradation/force-mode', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { mode, reason } = req.body

        if (!mode) {
          return reply.code(400).send({ error: 'Mode is required' })
        }

        if (!fastify.degradationManager) {
          return reply.code(503).send({ error: 'Degradation manager not available' })
        }

        logger.info('Force degradation mode', { mode })
        const result = fastify.degradationManager.forceMode(mode, reason || 'Admin override')
        const status = fastify.degradationManager.getAllStatus()

        return reply.code(200).send({
          success: true,
          ...result,
          status,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to force degradation mode' }
    )
  })

  fastify.get('/api/admin/cors', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        if (!fastify.corsConfig) {
          return reply.code(503).send({ error: 'CORS config not available' })
        }

        logger.info('Get CORS config')
        const config = fastify.corsConfig.getConfig()
        const stats = fastify.corsConfig.getStats()

        return reply.code(200).send({
          success: true,
          config,
          stats,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to get CORS config' }
    )
  })

  fastify.post('/api/admin/cors/origin', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { origin } = req.body

        if (!origin) {
          return reply.code(400).send({ error: 'Origin is required' })
        }

        if (!fastify.corsConfig) {
          return reply.code(503).send({ error: 'CORS config not available' })
        }

        logger.info('Add CORS origin', { origin })
        const added = fastify.corsConfig.addOrigin(origin)

        return reply.code(200).send({
          success: true,
          origin,
          added,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to add CORS origin' }
    )
  })

  fastify.delete('/api/admin/cors/origin', {
    preHandler: adminOnlyMiddleware,
  }, async (req, reply) => {
    return await APIMethodWrapper.wrapFastifyMethod(
      async () => {
        const { origin } = req.body

        if (!origin) {
          return reply.code(400).send({ error: 'Origin is required' })
        }

        if (!fastify.corsConfig) {
          return reply.code(503).send({ error: 'CORS config not available' })
        }

        logger.info('Remove CORS origin', { origin })
        const removed = fastify.corsConfig.removeOrigin(origin)

        return reply.code(200).send({
          success: true,
          origin,
          removed,
        })
      },
      reply,
      { logger, defaultStatusCode: 500, defaultMessage: 'Failed to remove CORS origin' }
    )
  })
}
