import cors from '@fastify/cors'
import compress from '@fastify/compress'
import multipart from '@fastify/multipart'
import ws from '@fastify/websocket'
import { LoggerFactory } from '../../core/utils/logging/index.js'
import { createRequestIdMiddleware, createErrorHandler } from './RequestTracking.js'
import { createTimeoutMiddleware } from './TimeoutMiddleware.js'
import { ErrorResponses } from './ErrorResponses.js'
import { ErrorResponseBuilder } from '../utils/api/ErrorResponseBuilder.js'

const logger = LoggerFactory.get('ServerMiddleware')

const isHealthEndpoint = (url) => url.startsWith('/health') || url === '/metrics'

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
      if (!isHealthEndpoint(request.url)) {
        return ErrorResponseBuilder.sendError(reply, 'SERVICE_UNAVAILABLE', 'Server is shutting down')
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
        return ErrorResponseBuilder.sendError(reply, 'PERMISSION_DENIED', `CORS policy violation: Origin ${origin} is not allowed`)
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
