import { Plugin } from './Plugin.js'
import { AssetLoader } from './core/AssetLoader.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('AssetPlugin')

export class AssetPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.name = 'Asset'
    this.version = '1.0.0'
    this.system = null
    this.assetLoader = new AssetLoader()
  }

  async init() {
    this.system = this.world.loader
    if (!this.system) {
      logger.warn('Loader system not available')
      return
    }
    logger.info('Asset plugin initialized')
  }

  async destroy() {
    this.system = null
    logger.info('Asset plugin destroyed')
  }

  getAPI() {
    return {
      load: async (type, url) => {
        if (!this.enabled || !this.system) return null
        return this.system.load?.(type, url) || null
      },

      get: (type, url) => {
        if (!this.enabled || !this.system) return null
        return this.system.get?.(type, url) || null
      },

      has: (type, url) => {
        if (!this.enabled || !this.system) return false
        return this.system.has?.(type, url) || false
      },

      preload: (type, url) => {
        if (!this.enabled || !this.system) return false
        return this.system.preload?.(type, url) || false
      },

      cache: (type, url, data) => {
        if (!this.enabled || !this.system) return false
        if (!this.system.results) return false
        const key = `${type}/${url}`
        this.system.results.set(key, data)
        return true
      },

      getCached: (type, url) => {
        if (!this.enabled || !this.system) return null
        return this.system.get?.(type, url) || null
      },

      setFile: (url, file) => {
        if (!this.enabled || !this.system) return false
        return this.system.setFile?.(url, file) || false
      },

      hasFile: (url) => {
        if (!this.enabled || !this.system) return false
        return this.system.hasFile?.(url) || false
      },

      getFile: (url, name) => {
        if (!this.enabled || !this.system) return null
        return this.system.getFile?.(url, name) || null
      },

      registerHandler: (type, handler) => {
        if (!this.enabled) return false
        return this.assetLoader.registerHandler(type, handler)
      },

      loadAsync: async (type, url, options) => {
        if (!this.enabled || !this.system) return null
        return this.system.load?.(type, url, options) || null
      },

      clearCache: (type) => {
        if (!this.enabled) return false
        this.assetLoader.clear(type)
        return true
      },

      cacheAsset: (type, url, data) => {
        if (!this.enabled) return false
        this.assetLoader.cache(type, url, data)
        return true
      },

      getLoaderStats: () => {
        return this.assetLoader.getStats()
      },

      getStatus: () => {
        if (!this.enabled || !this.system) return null
        const loaderStats = this.assetLoader.getStats()
        return {
          active: true,
          cached: this.system.results?.size || 0,
          pending: this.system.promises?.size || 0,
          preloading: !!this.system.preloader,
          loaderCache: loaderStats.cached,
          loaderPending: loaderStats.pending,
          loaderHandlers: loaderStats.handlers
        }
      }
    }
  }
}
