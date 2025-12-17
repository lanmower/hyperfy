import { System } from './System.js'

/**
 * Base Loader System
 *
 * - Shared functionality for ClientLoader and ServerLoader
 * - Manages asset cache, preloading, and type dispatch
 * - Subclasses override getTypeHandlers() for platform-specific handlers
 *
 */
export class BaseLoader extends System {
  constructor(world) {
    super(world)
    this.promises = new Map()
    this.results = new Map()
    this.preloadItems = []
    this.resolveURL = world.resolveURL
    this.setupTypeRegistry()
  }

  /**
   * Sets up the type handler registry
   * Each type maps to a handler function that loads assets
   */
  setupTypeRegistry() {
    this.typeHandlers = this.getTypeHandlers()
  }

  /**
   * Override in subclass to define platform-specific type handlers
   * Returns object mapping asset type -> handler function
   */
  getTypeHandlers() {
    return {}
  }

  /**
   * Check if an asset is already loaded/loading
   */
  has(type, url) {
    const key = `${type}/${url}`
    return this.promises.has(key)
  }

  /**
   * Get a cached asset result
   */
  get(type, url) {
    const key = `${type}/${url}`
    return this.results.get(key)
  }

  /**
   * Add an asset to the preload queue
   */
  preload(type, url) {
    this.preloadItems.push({ type, url })
  }

  /**
   * Execute all queued preload items
   */
  execPreload() {
    const promises = this.preloadItems.map(item => this.load(item.type, item.url))
    this.preloader = Promise.allSettled(promises).then(() => {
      this.preloader = null
    })
  }

  /**
   * Load an asset by type and URL
   * Uses cached results if already loaded
   * Dispatches to type-specific handler
   */
  load(type, url) {
    const key = `${type}/${url}`
    if (this.promises.has(key)) {
      return this.promises.get(key)
    }

    // Allow subclass to resolve URL (different behavior on client vs server)
    url = this.resolveURL(url, this.isServer)

    const handler = this.typeHandlers[type]
    if (!handler) {
      console.warn(`No handler for asset type: ${type}`)
      return Promise.resolve(null)
    }

    const promise = handler(url).then(result => {
      this.results.set(key, result)
      return result
    })

    this.promises.set(key, promise)
    return promise
  }

  /**
   * Clean up all cached assets
   */
  destroy() {
    this.promises.clear()
    this.results.clear()
    this.preloadItems = []
  }
}
