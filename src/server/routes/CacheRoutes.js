export async function registerCacheRoutes(server, db) {
  server.get('/api/cache/stats', async (request, reply) => {
    try {
      const cacheStats = db.stats()
      const dbMetrics = db.metrics()
      return {
        success: true,
        cache: cacheStats,
        database: dbMetrics,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error.message,
      })
    }
  })

  server.get('/api/database/metrics', async (request, reply) => {
    try {
      const metrics = db.metrics()
      return {
        success: true,
        metrics,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error.message,
      })
    }
  })

  server.get('/api/cache/warmup', async (request, reply) => {
    try {
      const { CacheWarmer } = await import('../cache/CacheWarmer.js')
      const warmer = new CacheWarmer(db)
      await warmer.warm()

      return {
        success: true,
        stats: warmer.getStats(),
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error.message,
      })
    }
  })

  server.post('/api/cache/clear', async (request, reply) => {
    try {
      db.cache.clear()
      return {
        success: true,
        message: 'Cache cleared',
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error.message,
      })
    }
  })

  server.post('/api/cache/invalidate', async (request, reply) => {
    try {
      const { pattern } = request.body || {}
      if (!pattern) {
        return reply.status(400).send({
          success: false,
          error: 'Pattern required',
        })
      }

      db.cache.invalidate(pattern)
      return {
        success: true,
        message: `Cache invalidated for pattern: ${pattern}`,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error.message,
      })
    }
  })

  server.get('/api/cache/health', async (request, reply) => {
    try {
      const stats = db.stats()
      const hitRate = parseFloat(stats.hitRate)

      return {
        success: true,
        healthy: hitRate > 50,
        hitRate: `${hitRate}%`,
        size: stats.size,
        maxSize: stats.maxSize,
        memoryUsage: stats.memoryUsage,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error.message,
      })
    }
  })
}

export default registerCacheRoutes
