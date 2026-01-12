export class ErrorLoggingHelper {
  static logError(logger, error, context = {}) {
    if (error instanceof Error) {
      logger.error(error.message, {
        ...context,
        stack: error.stack,
        name: error.name
      })
    } else {
      logger.error(String(error), context)
    }
  }

  static logException(logger, err, options = {}) {
    const { module = 'Unknown', category = 'Exception' } = options
    const errorData = {
      module,
      category,
      message: err?.message || String(err),
      name: err?.name,
      stack: err?.stack
    }
    logger.error(err?.message || 'Unknown error', errorData)
  }

  static captureStackTrace(err) {
    if (!err.stack) {
      Error.captureStackTrace(err, this.captureStackTrace)
    }
    return err
  }
}
