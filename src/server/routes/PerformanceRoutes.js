import { registerPerformanceEndpoints, getPerformanceMetrics } from '../performance/PerformanceMiddleware.js'
import { registerCachePurgeEndpoint, getCDNMetadata, getOriginConfig } from '../performance/CDNConfiguration.js'
import { getCompressionStats } from '../performance/CompressionManager.js'
import { getCacheStats } from '../performance/CachingStrategy.js'

export function registerPerformanceRoutes(fastify) {
  registerPerformanceEndpoints(fastify)
  registerCachePurgeEndpoint(fastify)

  fastify.get('/admin/performance', async (request, reply) => {
    const metrics = getPerformanceMetrics(fastify)
    const compression = getCompressionStats(fastify)
    const cache = getCacheStats()
    const cdn = getCDNMetadata(fastify)

    return reply.send({
      performance: metrics || { error: 'No metrics available' },
      compression,
      cache,
      cdn,
    })
  })

  fastify.get('/admin/cdn/config', async (request, reply) => {
    return reply.send({
      origin: getOriginConfig(),
      metadata: getCDNMetadata(fastify),
    })
  })
}
