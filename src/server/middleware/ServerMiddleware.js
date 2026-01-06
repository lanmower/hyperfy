import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import ws from '@fastify/websocket'
import { LoggerFactory } from '../../core/utils/logging/index.js'
import { createRequestIdMiddleware, createErrorHandler } from './RequestTracking.js'
import { createTimeoutMiddleware } from './TimeoutMiddleware.js'
import { ErrorResponses } from './ErrorResponses.js'
import { ErrorResponseBuilder } from '../utils/api/ErrorResponseBuilder.js'
import { setupCompression } from '../performance/CompressionManager.js'
import { setupCacheHeaders, addETagSupport } from '../performance/CachingStrategy.js'
import { trackResponseTime, enforcePerformanceBudgets } from '../performance/PerformanceMiddleware.js'

const logger = LoggerFactory.get('ServerMiddleware')

const isHealthEndpoint = (url) => url.startsWith('/health') || url === '/metrics'

export async function registerMiddleware(fastify, timeoutManager, logger, errorTracker, corsConfig, shutdownManager) {
  await fastify.register(createRequestIdMiddleware())
  await fastify.register(createErrorHandler(logger, errorTracker))
  await fastify.register(createTimeoutMiddleware(timeoutManager))

  fastify.addHook('onRequest', async (request, reply) => {
    if (reply.headersSent) return
    try {
      reply.header('X-Content-Type-Options', 'nosniff')
      reply.header('X-Frame-Options', 'SAMEORIGIN')
      reply.header('X-XSS-Protection', '1; mode=block')
      reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')
      reply.header('Permissions-Policy', 'microphone=(), camera=(), geolocation=()')
    } catch (err) {
      // Headers already sent, skip
    }
  })

  const corsOptions = corsConfig.getCORSOptions()
  await fastify.register(cors, corsOptions)
  logger.info('[CORS] CORS configuration registered', {
    origins: corsConfig.allowedOrigins.length,
    methods: corsConfig.allowedMethods.length,
  })

  fastify.addHook('onRequest', async (request, reply) => {
    if (shutdownManager.isShuttingDown) {
      if (!isHealthEndpoint(request.url)) {
        const err = new Error('Server is shutting down')
        err.statusCode = 503
        err.code = 'SERVICE_UNAVAILABLE'
        throw err
      }
    }

    const origin = request.headers.origin
    if (origin && !corsConfig.isOriginAllowed(origin)) {
      if (!isHealthEndpoint(request.url)) {
        logger.warn(`[CORS] Blocked request from non-whitelisted origin: ${origin}`, {
          url: request.url,
          method: request.method,
        })
        corsConfig.logRejectedRequest(origin)
        const err = new Error(`CORS policy violation: Origin ${origin} is not allowed`)
        err.statusCode = 403
        err.code = 'PERMISSION_DENIED'
        throw err
      }
    }
  })

  // Caching middleware causes HTTP timeouts - disabled for now
  // setupCacheHeaders(fastify)
  // addETagSupport(fastify)
  // trackResponseTime(fastify)
  // enforcePerformanceBudgets(fastify)

  await fastify.register(multipart, {
    limits: {
      fileSize: 200 * 1024 * 1024,
    },
  })
  await fastify.register(ws)
}
