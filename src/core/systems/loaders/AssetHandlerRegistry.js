import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('AssetHandlerRegistry')

export class AssetHandlerRegistry {
  constructor() {
    this.handlers = new Map()
    this.insertHandlers = new Map()
  }

  register(type, config) {
    if (typeof config === 'function') {
      this.handlers.set(type, config)
    } else {
      this.handlers.set(type, {
        parse: config.parse,
        insert: config.insert,
        cache: config.cache !== false,
      })
    }
  }

  has(type) {
    return this.handlers.has(type)
  }

  get(type) {
    return this.handlers.get(type)
  }

  async load(type, url, file, key, loaderContext) {
    const handler = this.handlers.get(type)
    if (!handler) {
      logger.warn('No handler for asset type', { type, url })
      return null
    }

    if (typeof handler === 'function') {
      return handler(url, file, key, loaderContext)
    }

    return handler.parse(url, file, key, loaderContext)
  }

  async insert(type, localUrl, url, file, key, loaderContext) {
    const handler = this.handlers.get(type)
    if (!handler?.insert) {
      logger.warn('No insert handler for asset type', { type, url })
      return null
    }
    return handler.insert(localUrl, url, file, key, loaderContext)
  }

  handle(type, ...args) {
    const handler = this.handlers.get(type)
    return handler?.(...args)
  }

  getTypes() {
    return Array.from(this.handlers.keys())
  }

  getAll() {
    return Object.fromEntries(this.handlers)
  }

  clear() {
    this.handlers.clear()
  }
}
