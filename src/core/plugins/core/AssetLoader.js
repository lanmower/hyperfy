import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('AssetLoader')

export class AssetLoader {
  constructor() {
    this.cache = new Map()
    this.promises = new Map()
    this.handlers = new Map()
  }

  registerHandler(type, handler) {
    if (typeof handler !== 'function') {
      logger.warn('Handler must be function', { type })
      return false
    }
    this.handlers.set(type, handler)
    return true
  }

  hasHandler(type) {
    return this.handlers.has(type)
  }

  async load(type, url, options = {}) {
    const key = `${type}/${url}`

    if (options.skipCache !== true) {
      const cached = this.cache.get(key)
      if (cached) return cached
    }

    if (this.promises.has(key)) {
      return this.promises.get(key)
    }

    const handler = this.handlers.get(type)
    if (!handler) {
      logger.warn('No handler for type', { type })
      return null
    }

    const promise = handler(url, options)
      .then(result => {
        this.cache.set(key, result)
        return result
      })
      .catch(err => {
        logger.error('Load error', { type, url, error: err.message })
        this.promises.delete(key)
        throw err
      })

    this.promises.set(key, promise)
    return promise
  }

  get(type, url) {
    const key = `${type}/${url}`
    return this.cache.get(key) || null
  }

  has(type, url) {
    const key = `${type}/${url}`
    return this.cache.has(key)
  }

  cache(type, url, data) {
    const key = `${type}/${url}`
    this.cache.set(key, data)
    return true
  }

  clear(type = null) {
    if (type) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${type}/`)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
      this.promises.clear()
    }
  }

  getStats() {
    return {
      cached: this.cache.size,
      pending: this.promises.size,
      handlers: this.handlers.size,
    }
  }

  destroy() {
    this.cache.clear()
    this.promises.clear()
    this.handlers.clear()
  }
}
