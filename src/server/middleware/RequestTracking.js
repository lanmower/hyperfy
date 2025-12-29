import { nanoid } from 'nanoid'

export function createRequestIdMiddleware() {
  return (fastify, opts, done) => {
    fastify.addHook('onRequest', async (request, reply) => {
      request.id = request.headers['x-request-id'] || nanoid(12)
      request.startTime = performance.now()
    })

    fastify.addHook('onResponse', async (request, reply) => {
      const duration = performance.now() - request.startTime
      const metrics = {
        requestId: request.id,
        method: request.method,
        path: request.url,
        status: reply.statusCode,
        duration: Math.round(duration),
        timestamp: new Date().toISOString(),
      }

      if (fastify.errorTracker) {
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

    done()
  }
}

export function createErrorHandler(logger, errorTracker) {
  return (fastify, opts, done) => {
    fastify.setErrorHandler(async (err, request, reply) => {
      const requestId = request.id || 'unknown'

      logger.setRequestId(requestId)
      logger.error(err.message, {
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

      const statusCode = err.statusCode || 500
      reply.code(statusCode).send({
        error: {
          message: err.message,
          requestId,
          timestamp: new Date().toISOString(),
        },
      })
    })

    done()
  }
}
