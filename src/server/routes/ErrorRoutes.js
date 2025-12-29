import { readJWT } from '../../core/utils/helpers/crypto.js'
import { ComponentLogger } from '../../core/utils/logging/ComponentLogger.js'
import { ErrorResponse, SuccessResponse } from '../utils/errors/ErrorResponse.js'

const logger = new ComponentLogger('ErrorRoutes')
const VALID_SIDES = new Set(['client', 'server', 'client-reported'])
const VALID_TYPES = new Set(['error', 'warning', 'critical', 'info', 'debug'])
const MAX_LIMIT = 1000
const DEFAULT_LIMIT = 50
const adminErrorRateLimits = new Map()

async function validateAdminToken(request) {
  const authHeader = request.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return false
  }

  try {
    const decoded = await readJWT(token)
    const adminCode = process.env.ADMIN_CODE
    if (!adminCode) return false
    return !!decoded.userId
  } catch (err) {
    return false
  }
}

function checkAdminRateLimit(clientIP) {
  const now = Date.now()
  const oneMinuteAgo = now - 60000

  if (!adminErrorRateLimits.has(clientIP)) {
    adminErrorRateLimits.set(clientIP, [])
  }

  const requests = adminErrorRateLimits.get(clientIP)
  const recentRequests = requests.filter(timestamp => timestamp > oneMinuteAgo)

  if (recentRequests.length >= 30) {
    return false
  }

  recentRequests.push(now)
  adminErrorRateLimits.set(clientIP, recentRequests)
  return true
}

export function registerErrorRoutes(fastify, world) {
  fastify.get('/api/errors', async (request, reply) => {
    try {
      const isAdmin = await validateAdminToken(request)
      if (!isAdmin) {
        const response = ErrorResponse.unauthorized('Authentication required')
        return reply.code(response.statusCode).send(response.toJSON())
      }

      const clientIP = request.headers['x-forwarded-for']?.split(',')[0].trim() ||
        request.headers['x-real-ip'] ||
        request.ip ||
        'unknown'

      if (!checkAdminRateLimit(clientIP)) {
        const response = ErrorResponse.tooManyRequests('Rate limit exceeded', 60)
        return reply.code(response.statusCode).send(response.toJSON())
      }

      const { limit, type, since, side, critical } = request.query
      const options = {}

      const parsedLimit = limit ? parseInt(limit, 10) : DEFAULT_LIMIT
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > MAX_LIMIT) {
        options.limit = DEFAULT_LIMIT
      } else {
        options.limit = parsedLimit
      }

      if (type && VALID_TYPES.has(type)) {
        options.type = type
      }

      if (since && /^\d+$/.test(since)) {
        options.since = parseInt(since, 10)
      }

      if (side && VALID_SIDES.has(side)) {
        options.side = side
      }

      if (critical !== undefined && (critical === 'true' || critical === 'false')) {
        options.critical = critical === 'true'
      }

      if (!world.errorMonitor) {
        const response = ErrorResponse.serviceUnavailable('Error monitoring not available')
        return reply.code(response.statusCode).send(response.toJSON())
      }

      const errors = world.errorMonitor.getErrors(options)
      const stats = world.errorMonitor.getStats()

      const degradationManager = fastify.degradationManager
      const degradationStats = degradationManager ? degradationManager.getStats() : null

      const response = SuccessResponse.ok({
        errors,
        stats,
        degradation: degradationStats,
      })
      return reply.code(response.statusCode).send(response.toJSON())
    } catch (error) {
      logger.error('Error endpoint failed', { error: error.message })
      const response = ErrorResponse.internalError('Internal server error')
      return reply.code(response.statusCode).send(response.toJSON())
    }
  })

  fastify.post('/api/errors/clear', async (request, reply) => {
    try {
      const isAdmin = await validateAdminToken(request)
      if (!isAdmin) {
        const response = ErrorResponse.unauthorized('Authentication required')
        return reply.code(response.statusCode).send(response.toJSON())
      }

      const clientIP = request.headers['x-forwarded-for']?.split(',')[0].trim() ||
        request.headers['x-real-ip'] ||
        request.ip ||
        'unknown'

      if (!checkAdminRateLimit(clientIP)) {
        const response = ErrorResponse.tooManyRequests('Rate limit exceeded', 60)
        return reply.code(response.statusCode).send(response.toJSON())
      }

      if (!world.errorMonitor) {
        const response = ErrorResponse.serviceUnavailable('Error monitoring not available')
        return reply.code(response.statusCode).send(response.toJSON())
      }

      const count = world.errorMonitor.clearErrors()
      logger.info('Errors cleared by admin', { clearedCount: count })

      const response = SuccessResponse.ok({ cleared: count })
      return reply.code(response.statusCode).send(response.toJSON())
    } catch (error) {
      logger.error('Error clear endpoint failed', { error: error.message })
      const response = ErrorResponse.internalError('Internal server error')
      return reply.code(response.statusCode).send(response.toJSON())
    }
  })

  fastify.get('/api/errors/stream', { websocket: true }, async (ws, req) => {
    try {
      const isAdmin = await validateAdminToken(req)
      if (!isAdmin) {
        ws.close(1008, 'Authentication required')
        return
      }

      if (!world.errorMonitor) {
        ws.close(1011, 'Error monitoring not available')
        return
      }

      const cleanup = world.errorMonitor.addListener((event, data) => {
        try {
          ws.send(JSON.stringify({ event, data, timestamp: new Date().toISOString() }))
        } catch (err) {
          cleanup()
        }
      })

      ws.on('close', cleanup)
      ws.on('error', cleanup)

      try {
        const degradationManager = fastify.degradationManager
        const degradationStats = degradationManager ? degradationManager.getStats() : null

        ws.send(JSON.stringify({
          event: 'connected',
          data: {
            stats: world.errorMonitor.getStats(),
            recentErrors: world.errorMonitor.getErrors({ limit: 10 }),
            degradation: degradationStats,
          },
          timestamp: new Date().toISOString()
        }))
      } catch (err) {
        cleanup()
      }
    } catch (err) {
      ws.close(1008, 'Authentication failed')
    }
  })
}
