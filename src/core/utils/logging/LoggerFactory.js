import { StructuredLogger } from './StructuredLogger.js'

const cache = new Map()

export class LoggerFactory {
  static get(name) {
    if (!cache.has(name)) {
      cache.set(name, new StructuredLogger(name))
    }
    return cache.get(name)
  }

  static create(name) {
    const logger = new StructuredLogger(name)
    cache.set(name, logger)
    return logger
  }

  static clear() {
    cache.clear()
  }

  static has(name) {
    return cache.has(name)
  }
}
