import { nanoid } from 'nanoid'
import { ErrorResponseBuilder } from '../utils/api/ErrorResponseBuilder.js'
import { createFastifyPlugin } from './PluginFactory.js'
import { ServerConstants } from '../config/Constants.js'

function createRequestIdMiddlewareHook() {
  async function requestIdHook(fastify) {
    fastify.addHook('onRequest', async (request, reply) => {
      request.id = request.headers['x-request-id'] || nanoid(ServerConstants.LOGGING.REQUEST_ID_LENGTH)
      request.startTime = performance.now()
    })

    fastify.addHook('onResponse', async (request, reply) => {
      const duration = performance.now() - request.startTime

      if (fastify.errorTracker && typeof fastify.errorTracker.addBreadcrumb === 'function') {
        fastify.errorTracker.addBreadcrumb('HTTP Request', {
          method: request.method,
          path: request.url,
          status: reply.statusCode,
          duration: Math.round(duration),
        })
      }

      if (fastify.metrics) {
        fastify.metrics.counter('http.requests.total')
        fastify.metrics.counter(`http.requests.${reply.statusCode}`)
        fastify.metrics.sample('http.response_time_ms', duration)
      }
    })
  }

  return createFastifyPlugin(requestIdHook, 'request-id-middleware')
}

function createErrorHandlerHook(logger, errorTracker) {
  async function errorHandlerHook(fastify) {
    fastify.setErrorHandler(async (err, request, reply) => {
      const requestId = request.id || 'unknown'

      logger.error(err.message, {
        requestId,
        path: request.url,
        method: request.method,
        statusCode: err.statusCode || 500,
        stack: err.stack,
      })

      errorTracker?.captureException(err, {
        requestId,
        category: 'HTTP',
        module: 'RequestHandler',
        method: request.method,
        path: request.url,
      })

      return ErrorResponseBuilder.sendErrorFromException(reply, err, requestId)
    })
  }

  return createFastifyPlugin(errorHandlerHook, 'error-handler-middleware')
}

export function createRequestIdMiddleware() {
  return createRequestIdMiddlewareHook()
}

export function createErrorHandler(logger, errorTracker) {
  return createErrorHandlerHook(logger, errorTracker)
}
