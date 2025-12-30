import fp from 'fastify-plugin'
import { ComponentLogger } from '../../core/utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('TimeoutMiddleware')

export function createTimeoutMiddleware(timeoutManager) {
  async function timeoutMiddleware(fastify, opts) {
    fastify.addHook('onRequest', async (request, reply) => {
      const timeout = timeoutManager.getTimeout('http')
      const path = request.url

      request.timeoutTimer = setTimeout(() => {
        if (!reply.sent) {
          timeoutManager.recordTimeout('http', path)
          logger.error('HTTP request timeout', { method: request.method, path, timeout })
          reply.code(408).send({
            error: 'Request timeout',
            message: `Request exceeded ${timeout}ms timeout`,
            path,
          })
        }
      }, timeout)
    })

    fastify.addHook('onResponse', async (request, reply) => {
      if (request.timeoutTimer) {
        clearTimeout(request.timeoutTimer)
        request.timeoutTimer = null
      }
    })

    fastify.addHook('onError', async (request, reply, error) => {
      if (request.timeoutTimer) {
        clearTimeout(request.timeoutTimer)
        request.timeoutTimer = null
      }
    })
  }

  return fp(timeoutMiddleware, {
    name: 'timeout-middleware',
    fastify: '>=4.x',
  })
}
