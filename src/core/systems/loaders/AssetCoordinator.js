/* Unified asset coordination for loading, caching, fallback, and URL resolution */

export class AssetCoordinator {
  constructor() {
    this.cache = new Map()
    this.loaders = new Map()
    this.fallbacks = []
    this.maxCacheSize = 1000
  }

  registerLoader(type, loader) {
    this.loaders.set(type, loader)
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

  addFallback(fn) {
    this.fallbacks.push(fn)
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
  }
}
