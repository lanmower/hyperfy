import { LoggerFactory } from '../../core/utils/logging/index.js'
import { createFastifyPlugin } from './PluginFactory.js'
import { ErrorResponses } from './ErrorResponses.js'

const logger = LoggerFactory.get('TimeoutMiddleware')

export function createTimeoutMiddleware(timeoutManager) {
  async function timeoutMiddleware(fastify) {
    fastify.addHook('onRequest', async (request, reply) => {
      const timeout = timeoutManager.getTimeout('http')
      const path = request.url

      request.timeoutTimer = setTimeout(() => {
        if (!reply.sent) {
          timeoutManager.recordTimeout('http', path)
          logger.error('HTTP request timeout', { method: request.method, path, timeout })
          reply.code(408).send(ErrorResponses.timeout(timeout, path, request.method))
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

  return createFastifyPlugin(timeoutMiddleware, 'timeout-middleware')
}
