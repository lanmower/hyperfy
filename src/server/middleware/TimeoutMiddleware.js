import { LoggerFactory } from '../../core/utils/logging/index.js'
import { createFastifyPlugin } from './PluginFactory.js'
import { ErrorResponseBuilder } from '../utils/api/ErrorResponseBuilder.js'

const logger = LoggerFactory.get('TimeoutMiddleware')
const STATIC_PATHS = ['/assets/', '/', '/env.js', '/public/', '/src/']

const isStaticPath = (path) => {
  const cleanPath = path.split('?')[0]
  return STATIC_PATHS.some(p => cleanPath.startsWith(p) || cleanPath === p)
}

export function createTimeoutMiddleware(timeoutManager) {
  async function timeoutMiddleware(fastify) {
    fastify.addHook('onRequest', async (request, reply) => {
      if (isStaticPath(request.url)) {
        return
      }

      const timeout = timeoutManager.getTimeout('http')
      const path = request.url

      request.timeoutTimer = setTimeout(() => {
        if (!reply.sent) {
          timeoutManager.recordTimeout('http', path)
          logger.error('HTTP request timeout', { method: request.method, path, timeout })
          return ErrorResponseBuilder.sendError(reply, 'INTERNAL_ERROR', 'Request timeout', { timeout, path, method: request.method })
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
