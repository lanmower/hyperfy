import { StructuredLogger } from './StructuredLogger.js'

export class ComponentLogger {
  constructor(name) {
    this.name = name
    this.logger = new StructuredLogger(name, {
      minLevel: globalThis.__LOG_LEVEL__ || 'INFO',
      includeTimestamp: false
    })
  }

  error(message, context = null) {
    if (context instanceof Error) {
      context = { error: context.message, stack: context.stack }
    }
    this.logger.error(message, context || {})
  }

  warn(message, context = null) {
    this.logger.warn(message, context || {})
  }

  info(message, context = null) {
    this.logger.info(message, context || {})
  }

  debug(message, context = null) {
    this.logger.debug(message, context || {})
  }

  trace(message, context = null) {
    this.logger.trace(message, context || {})
  }

  time(label) {
    return this.logger.time(label)
  }

  static setGlobalLevel(level) {
    globalThis.__LOG_LEVEL__ = level
  }

  static addGlobalHandler(handler) {
    if (!globalThis.__LOG_HANDLERS__) {
      globalThis.__LOG_HANDLERS__ = []
    }
    globalThis.__LOG_HANDLERS__.push(handler)
  }
}

export default ComponentLogger
