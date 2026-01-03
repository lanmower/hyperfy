import { tracer } from '../../utils/tracing/index.js'
import { BaseManager } from '../../patterns/index.js'

export class ResourceManager extends BaseManager {
  constructor(world) {
    super(world, 'ResourceManager')
    this.loader = null
    this.assetHandlers = null
    this.videoFactory = null
    this.loading = new Map()
    this.stats = {
      loaded: 0,
      failed: 0,
      preloading: 0,
      cached: 0,
    }
  }

  async initInternal() {
  }

  initialize(loader, assetHandlers, videoFactory) {
    this.loader = loader
    this.assetHandlers = assetHandlers
    this.videoFactory = videoFactory

    this.logger.info('ResourceManager initialized', {
      hasLoader: !!loader,
      hasAssetHandlers: !!assetHandlers,
      hasVideoFactory: !!videoFactory,
    })
  }

  async load(type, url) {
    if (!this.loader) {
      this.logger.warn('ResourceManager not initialized')
      return null
    }

    return tracer.traceAsync(`resource_load[${type}/${url}]`, async span => {
      span?.setAttribute('type', type)
      span?.setAttribute('url', url)

      const key = `${type}/${url}`

      const existing = this.loading.get(key)
      if (existing) {
        span?.setAttribute('cached', true)
        return existing
      }

      const promise = this.loader.load(type, url)
        .then(result => {
          this.stats.loaded++
          this.loading.delete(key)
          span?.setAttribute('status', 'success')
          return result
        })
        .catch(err => {
          this.stats.failed++
          this.logger.error('Resource load failed', { type, url, error: err.message })
          this.loading.delete(key)
          span?.setAttribute('status', 'error')
          span?.setAttribute('error', err.message)
          return null
        })

      try {
        this.loading.set(key, promise)
      } catch (mapErr) {
        this.logger.error('Failed to cache resource', { type, url, error: mapErr.message })
        span?.setAttribute('cacheError', true)
      }
      span?.setAttribute('pending', true)
      return promise
    })
  }

  get(type, url) {
    if (!this.loader) return null
    return this.loader.get(type, url)
  }

  has(type, url) {
    if (!this.loader) return false
    const key = `${type}/${url}`
    return this.loader.results.has(key)
  }

  insert(type, url, file) {
    if (!this.loader) return
    this.loader.insert(type, url, file)
  }

  async preload(items) {
    if (!this.loader) return

    return tracer.traceAsync(`resource_preload`, async span => {
      span?.setAttribute('itemCount', items.length)

      this.stats.preloading = items.length
      const promises = items.map(item =>
        this.load(item.type, item.url)
          .then(() => {
            this.stats.preloading--
            span?.addEvent('preload_item_completed', { type: item.type, url: item.url })
          })
          .catch(err => {
            this.logger.error('Preload item failed', { type: item.type, url: item.url })
            this.stats.preloading--
            span?.addEvent('preload_item_failed', { type: item.type, url: item.url, error: err.message })
          })
      )

      const results = await Promise.allSettled(promises)
      const fulfilled = results.filter(r => r.status === 'fulfilled').length
      span?.setAttribute('fulfilled', fulfilled)
      span?.setAttribute('failed', results.length - fulfilled)
      return results
    })
  }

  registerAssetHandler(type, handler) {
    if (!this.assetHandlers) {
      this.logger.warn('AssetHandlers not initialized')
      return
    }

    this.assetHandlers.registry.register(type, handler)
  }

  registerInsertHandler(type, handler) {
    if (!this.assetHandlers) {
      this.logger.warn('AssetHandlers not initialized')
      return
    }

    this.assetHandlers.insertRegistry.register(type, handler)
  }

  setVRMHooks(hooks) {
    if (!this.assetHandlers) {
      this.logger.warn('AssetHandlers not initialized')
      return
    }

    this.assetHandlers.setVRMHooks(hooks)
  }

  createVideo(url) {
    if (!this.videoFactory) {
      this.logger.warn('VideoFactory not initialized')
      return null
    }

    return this.videoFactory(url, this.world)
  }

  getLoadingCount() {
    return this.loading.size
  }

  getCacheSize() {
    if (!this.loader) return 0
    return this.loader.results.size
  }

  getFallbackLog() {
    if (!this.loader) return []
    return this.loader.getFallbackLog?.() || []
  }

  getStats() {
    return {
      ...this.stats,
      loading: this.getLoadingCount(),
      cached: this.getCacheSize(),
    }
  }

  clear() {
    this.loading.clear()
    if (this.loader) {
      this.loader.destroy?.()
    }
  }

  async destroyInternal() {
    this.clear()
    this.loader = null
    this.assetHandlers = null
    this.videoFactory = null
    this.stats = {
      loaded: 0,
      failed: 0,
      preloading: 0,
      cached: 0,
    }
  }
}
