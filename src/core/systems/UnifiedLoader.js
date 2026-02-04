/* Unified loader: client and server asset loading separated */

import { System } from './System.js'
import { StructuredLogger } from '../utils/logging/index.js'


const logger = new StructuredLogger('UnifiedLoader')

export class UnifiedLoader extends System {
  static DEPS = {
    scripts: 'scripts',
    errors: 'errors',
  }

  constructor(world) {
    super(world)
    this.promises = new Map()
    this.results = new Map()
    this.preloadItems = []
    this.isServer = typeof window === 'undefined'
    this.maxCacheSize = 100
    this.cacheAccessOrder = []
  }

  async init() {
    if (this.isServer) {
      globalThis.self = { URL }
      globalThis.window = {}
      globalThis.document = { createElementNS: () => ({ style: {} }) }
      const serverHandlers = await import('./loaders/ServerAssetHandlers.js')
      this.handlers = new serverHandlers.ServerAssetHandlers(this.world, this.errors, this.scripts)
    } else {
      const assetHandlers = await import('./loaders/AssetHandlers.js')
      this.handlers = new assetHandlers.AssetHandlers(this, this.world)
    }
  }

  start() {
    if (!this.isServer && this.handlers?.start) {
      this.handlers.start()
    }
  }

  has(type, url) {
    const key = `${type}/${url}`
    return this.promises.has(key)
  }

  get(type, url) {
    const key = `${type}/${url}`
    return this.results.get(key)
  }

  preload(type, url) {
    this.preloadItems.push({ type, url })
  }

  execPreload() {
    if (this.isServer) return
    try {
      let loaded = 0
      const promises = this.preloadItems.map(item =>
        this.load(item.type, item.url)
          .then(() => {
            this.events.emit('progress', (++loaded / this.preloadItems.length) * 100)
          })
          .catch(err => {
            logger.error('Error preloading asset', { type: item.type, url: item.url, error: err.message })
          })
      )
      this.preloader = Promise.allSettled(promises).then(() => { this.preloader = null }).catch(err => {
        logger.error('Preload completed with errors', { error: err.message })
        this.preloader = null
      })
    } catch (err) {
      logger.error('Error in execPreload', { error: err.message })
      this.preloader = null
    }
  }

  load(type, url) {
    if (!url) return Promise.reject(new Error('URL is required'))
    url = this.world.resolveURL(url, this.isServer)
    const key = `${type}/${url}`

    if (this.promises.has(key)) {
      return this.promises.get(key)
    }

    const typeHandlers = this.handlers.getHandlers?.() || {}
    const typeHandler = typeHandlers[type]
    if (!typeHandler) {
      const err = new Error(`No handler for type: ${type}`)
      logger.error('Load failed', { type, url, error: err.message })
      return Promise.reject(err)
    }

    const promise = Promise.resolve()
      .then(async () => {
        if (this.isServer) return typeHandler(url, null, key)
        const response = await fetch(url)
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`)
        const blob = await response.blob()
        const file = new File([blob], url.split('/').pop(), { type: blob.type })
        return typeHandler(url, file, key)
      })
      .then(result => {
        if (this.results.size >= this.maxCacheSize) {
          const lruKey = this.cacheAccessOrder.shift()
          if (lruKey) {
            this.results.delete(lruKey)
          }
        }
        this.results.set(key, result)
        this.cacheAccessOrder.push(key)
        return result
      })
      .catch(err => {
        logger.error('Load failed', { type, url, error: err.message })
        this.promises.delete(key)
        throw err
      })

    this.promises.set(key, promise)
    return promise
  }

  fetchArrayBuffer(url) {
    if (this.handlers.fetchArrayBuffer) {
      return this.handlers.fetchArrayBuffer(url)
    }
    return fetch(url).then(r => r.arrayBuffer())
  }

  fetchText(url) {
    if (this.handlers.fetchText) {
      return this.handlers.fetchText(url)
    }
    return fetch(url).then(r => r.text())
  }
}
