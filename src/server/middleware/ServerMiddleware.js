import cors from '@fastify/cors'
import compress from '@fastify/compress'
import multipart from '@fastify/multipart'
import ws from '@fastify/websocket'
import { createRequestIdMiddleware, createErrorHandler } from './RequestTracking.js'
import { createTimeoutMiddleware } from './TimeoutMiddleware.js'

export function registerMiddleware(fastify, timeoutManager, logger, errorTracker, corsConfig, shutdownManager) {
  fastify.register(createRequestIdMiddleware())
  fastify.register(createErrorHandler(logger, errorTracker))
  fastify.register(createTimeoutMiddleware(timeoutManager))

  fastify.addHook('onSend', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff')
    reply.header('X-Frame-Options', 'SAMEORIGIN')
    reply.header('X-XSS-Protection', '1; mode=block')
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    reply.header('Permissions-Policy', 'microphone=(), camera=(), geolocation=()')
  })

  const corsOptions = corsConfig.getCORSOptions()
  fastify.register(cors, corsOptions)
  logger.info('[CORS] CORS configuration registered', {
    origins: corsConfig.allowedOrigins.length,
    methods: corsConfig.allowedMethods.length,
  })

  fastify.addHook('onRequest', async (request, reply) => {
    if (shutdownManager.isShuttingDown) {
      const isHealthEndpoint = request.url.startsWith('/health') || request.url === '/metrics'
      if (!isHealthEndpoint) {
        return reply.code(503).send({
          error: 'Service Unavailable',
          message: 'Server is shutting down',
          statusCode: 503,
        })
      }
    }

    const origin = request.headers.origin
    if (origin && !corsConfig.isOriginAllowed(origin)) {
      const isHealthEndpoint = request.url.startsWith('/health') || request.url === '/metrics'
      if (!isHealthEndpoint) {
        logger.warn(`[CORS] Blocked request from non-whitelisted origin: ${origin}`, {
          url: request.url,
          method: request.method,
        })
        corsConfig.logRejectedRequest(origin)
        reply.code(403).send({
          error: 'Forbidden',
          message: `CORS policy: Origin ${origin} is not allowed`,
          statusCode: 403,
        })
      }
    }
  })

  fastify.register(compress)
  fastify.register(multipart, {
    limits: {
      fileSize: 200 * 1024 * 1024,
    },
  })
  fastify.register(ws)
}
