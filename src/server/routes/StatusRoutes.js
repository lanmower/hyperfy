import { readJWT } from '../../core/utils/helpers/crypto.js'
import { createRateLimiter } from '../middleware/RateLimiter.js'
import { getAllFlags, getUserVariant } from '../features/FeatureFlags.js'
import { ComponentLogger } from '../../core/utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('StatusRoutes')

async function validateUserToken(request) {
  const authHeader = request.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return null
  }

  try {
    const decoded = await readJWT(token)
    return decoded.userId
  } catch (err) {
    return null
  }
}

export function registerStatusRoutes(fastify, world) {
  fastify.get('/health', {
    preHandler: createRateLimiter('health'),
  }, async (request, reply) => {
    try {
      const timeoutManager = fastify.timeoutManager
      const timeoutStats = timeoutManager ? timeoutManager.getStats() : null

      const degradationManager = fastify.degradationManager
      const degradationStats = degradationManager ? degradationManager.getStats() : null
      const isDegraded = degradationStats && degradationStats.mode !== 'NORMAL'

      const health = {
        status: isDegraded ? 'degraded' : 'ok',
        timestamp: new Date().toISOString(),
        timeouts: timeoutStats ? {
          total: timeoutStats.stats.total,
          configured: timeoutStats.timeouts,
        } : undefined,
        degradation: degradationStats || undefined,
      }

      return reply.code(200).send(health)
    } catch (error) {
      logger.error('Health check failed', { error: error.message })
      return reply.code(503).send({
        status: 'error',
        timestamp: new Date().toISOString(),
      })
    }
  })

  fastify.get('/status', {
    preHandler: createRateLimiter('api'),
  }, async (request, reply) => {
    try {
      const userId = await validateUserToken(request)

      if (!userId) {
        return reply.code(401).send({ error: 'Authentication required' })
      }

      const status = {
        uptime: Math.round(world.time),
        connectedUsersCount: world.network.sockets.size,
      }

      return reply.code(200).send(status)
    } catch (error) {
      logger.error('Status endpoint failed', { error: error.message })
      return reply.code(503).send({
        status: 'error',
        timestamp: new Date().toISOString(),
      })
    }
  })

  fastify.get('/status/full', {
    preHandler: createRateLimiter('admin'),
  }, async (request, reply) => {
    try {
      const authHeader = request.headers.authorization
      const token = authHeader?.replace('Bearer ', '')

      if (!token) {
        return reply.code(401).send({ error: 'Authentication required' })
      }

      const decoded = await readJWT(token)
      const userId = decoded.userId

      const player = world.entities.get(userId)
      if (!player || !player.isPlayer) {
        return reply.code(403).send({ error: 'Player entity not found' })
      }

      if (!player.isAdmin()) {
        return reply.code(403).send({ error: 'Admin access required' })
      }

      const timeoutManager = fastify.timeoutManager
      const timeoutStats = timeoutManager ? timeoutManager.getStats() : null

      const degradationManager = fastify.degradationManager
      const degradationStatus = degradationManager ? degradationManager.getAllStatus() : null

      const status = {
        uptime: Math.round(world.time),
        protected: process.env.ADMIN_CODE !== undefined ? true : false,
        connectedUsers: [],
        timeouts: timeoutStats || undefined,
        degradation: degradationStatus || undefined,
      }

      for (const socket of world.network.sockets.values()) {
        status.connectedUsers.push({
          id: socket.player.data.userId,
          position: socket.player.position.value.toArray(),
          name: socket.player.data.name,
          rank: socket.player.data.rank,
        })
      }

      return reply.code(200).send(status)
    } catch (error) {
      logger.error('Status full endpoint failed', { error: error.message })
      return reply.code(401).send({
        status: 'error',
        timestamp: new Date().toISOString(),
      })
    }
  })

  fastify.get('/api/feature-flags', {
    preHandler: createRateLimiter('api'),
  }, async (request, reply) => {
    try {
      const userId = await validateUserToken(request)

      if (!userId) {
        return reply.code(401).send({ error: 'Authentication required' })
      }

      const allFlags = getAllFlags()
      const userFlags = {}

      for (const [key, flag] of Object.entries(allFlags)) {
        if (flag.enabled) {
          const variant = getUserVariant(key, userId)
          userFlags[key] = {
            enabled: variant.enabled,
            rollout: flag.rollout,
            description: flag.description,
            variant: variant.variant,
          }
        }
      }

      return reply.code(200).send({
        success: true,
        flags: userFlags,
        userId,
      })
    } catch (error) {
      logger.error('Feature flags fetch failed', { error: error.message })
      return reply.code(500).send({
        error: 'Failed to fetch feature flags',
      })
    }
  })

  fastify.get('/api/timeouts', {
    preHandler: createRateLimiter('api'),
  }, async (request, reply) => {
    try {
      const userId = await validateUserToken(request)

      if (!userId) {
        return reply.code(401).send({ error: 'Authentication required' })
      }

      const timeoutManager = fastify.timeoutManager
      if (!timeoutManager) {
        return reply.code(503).send({ error: 'Timeout manager not available' })
      }

      const stats = timeoutManager.getStats()

      return reply.code(200).send({
        success: true,
        timeouts: stats,
      })
    } catch (error) {
      logger.error('Timeout stats fetch failed', { error: error.message })
      return reply.code(500).send({
        error: 'Failed to fetch timeout stats',
      })
    }
  })

  fastify.post('/api/timeouts/reset', {
    preHandler: createRateLimiter('admin'),
  }, async (request, reply) => {
    try {
      const authHeader = request.headers.authorization
      const token = authHeader?.replace('Bearer ', '')

      if (!token) {
        return reply.code(401).send({ error: 'Authentication required' })
      }

      const decoded = await readJWT(token)
      const userId = decoded.userId

      const player = world.entities.get(userId)
      if (!player || !player.isPlayer) {
        return reply.code(403).send({ error: 'Player entity not found' })
      }

      if (!player.isAdmin()) {
        return reply.code(403).send({ error: 'Admin access required' })
      }

      const timeoutManager = fastify.timeoutManager
      if (!timeoutManager) {
        return reply.code(503).send({ error: 'Timeout manager not available' })
      }

      timeoutManager.resetStats()

      return reply.code(200).send({
        success: true,
        message: 'Timeout statistics reset',
      })
    } catch (error) {
      logger.error('Timeout reset failed', { error: error.message })
      return reply.code(500).send({
        error: 'Failed to reset timeout stats',
      })
    }
  })
}
