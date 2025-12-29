export function wrapWithErrorTracking(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (err) {
      const errorTracker = global.errorTracker
      const logger = global.logger

      if (errorTracker) {
        errorTracker.captureException(err, {
          category: context.category || 'Unknown',
          module: context.module || 'Unknown',
          ...context,
        })
      }

      if (logger) {
        logger.error(err.message, {
          category: context.category,
          module: context.module,
          stack: err.stack.split('\n').slice(0, 5).join('\n'),
        })
      }

      throw err
    }
  }
}

export function setupGlobalErrorTracking(logger, errorTracker) {
  global.logger = logger
  global.errorTracker = errorTracker
}

export function captureHttpError(fastify, err, req, context = {}) {
  const errorTracker = fastify.errorTracker
  const logger = fastify.logger

  if (errorTracker) {
    errorTracker.captureException(err, {
      requestId: req.id,
      category: 'HTTP',
      module: 'RequestHandler',
      path: req.url,
      method: req.method,
      statusCode: err.statusCode || 500,
      ...context,
    })
  }

  if (logger) {
    logger.setRequestId(req.id)
    logger.error(err.message, {
      path: req.url,
      method: req.method,
      statusCode: err.statusCode || 500,
    })
  }
}

export function trackSystemEvent(logger, errorTracker, eventName, data = {}) {
  if (logger) {
    logger.info(eventName, data)
  }

  if (errorTracker) {
    errorTracker.addBreadcrumb(eventName, data)
  }
}
