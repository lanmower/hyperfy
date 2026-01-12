import { Plugin } from '../Plugin.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('AssetLoaderPlugin')

export class AssetLoaderPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
    this.name = 'AssetLoader'
    this.version = '1.0.0'
    this.loader = null
    this.handlers = new Map()
  }

  async init() {
    this.loader = this.world.loader
    if (!this.loader) {
      logger.warn('Loader system not available')
      return
    }
    logger.info('Asset loader plugin initialized')
  }

  async destroy() {
    this.handlers.clear()
    this.loader = null
    logger.info('Asset loader plugin destroyed')
  }

  registerAssetHandler(type, handler) {
    if (!this.enabled || !this.loader) return false
    this.handlers.set(type, handler)
    return true
  }

  getAPI() {
    return {
      load: async (type, url) => {
        if (!this.enabled || !this.loader) return null
        return this.loader.load(type, url)
      },

      loadGLTF: async (url) => {
        if (!this.enabled || !this.loader) return null
        return this.loader.load('glb', url)
      },

      loadTexture: async (url) => {
        if (!this.enabled || !this.loader) return null
        return this.loader.load('texture', url)
      },

      loadAudio: async (url) => {
        if (!this.enabled || !this.loader) return null
        return this.loader.load('audio', url)
      },

      preload: (items) => {
        if (!this.enabled || !this.loader) return false
        return this.loader.preload?.(items) || false
      },

      getLoadingStatus: () => {
        if (!this.enabled || !this.loader) return { loaded: 0, total: 0 }
        return {
          loaded: this.loader.loaded || 0,
          total: this.loader.total || 0,
          progress: this.loader.progress || 0
        }
      },

      registerHandler: (type, handler) => {
        return this.registerAssetHandler(type, handler)
      }
    }
  }
}
