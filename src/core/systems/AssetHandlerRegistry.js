import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('AssetHandlerRegistry')

export class AssetHandlerRegistry {
  constructor() {
    this.handlers = new Map()
    this.insertHandlers = new Map()
  }

  register(type, config) {
    this.handlers.set(type, {
      parse: config.parse,
      insert: config.insert,
      cache: config.cache !== false,
    })
  }

  async load(type, url, file, key, loaderContext) {
    const handler = this.handlers.get(type)
    if (!handler) {
      logger.warn('No handler for asset type', { type, url })
      return null
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

  getTypes() {
    return Array.from(this.handlers.keys())
  }
}
