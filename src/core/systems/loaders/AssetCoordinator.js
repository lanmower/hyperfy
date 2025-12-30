/* Unified asset coordination for loading, caching, fallback, and URL resolution */

import { FileManager } from './FileManager.js'
import { FallbackManager } from './FallbackManager.js'

export class AssetCoordinator {
  constructor(resolveURL) {
    this.cache = new Map()
    this.loaders = new Map()
    this.fallbacks = []
    this.maxCacheSize = 1000
    this.fileManager = new FileManager(resolveURL)
    this.fallbackManager = new FallbackManager()
  }

  setFile(url, file) {
    this.fileManager.set(url, file)
  }

  hasFile(url) {
    return this.fileManager.has(url)
  }

  getFile(url, name) {
    return this.fileManager.get(url, name)
  }

  registerLoader(type, loader) {
    this.loaders.set(type, loader)
  }

  addFallback(fn) {
    this.fallbacks.push(fn)
  }

  getFallback(type, url, err) {
    return this.fallbackManager.getFallback(type, url, err)
  }

  getUsageLog() {
    return this.fallbackManager.getUsageLog()
  }

  async loadFile(url) {
    return this.fileManager.load(url)
  }

  async load(url, type) {
    const cached = this.cache.get(url)
    if (cached) return cached

    const loader = this.loaders.get(type)
    if (!loader) throw new Error(`No loader for type ${type}`)

    try {
      const asset = await loader(url)
      this.cache.set(url, asset)
      this.pruneCache()
      return asset
    } catch (err) {
      for (const fallback of this.fallbacks) {
        try {
          return await fallback(url, type, err)
        } catch (fallbackErr) {
          continue
        }
      }
      throw err
    }
  }

  pruneCache() {
    if (this.cache.size > this.maxCacheSize) {
      const entries = Array.from(this.cache.entries())
      entries.slice(0, entries.length - this.maxCacheSize).forEach(([key]) => {
        this.cache.delete(key)
      })
    }
  }

  clear() {
    this.cache.clear()
    this.fileManager.clear()
  }
}
