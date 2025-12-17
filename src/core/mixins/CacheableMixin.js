

export const withCacheable = (Base) => class extends Base {
  constructor(...args) {
    super(...args)
    this.cache = new Map()
    this.cacheVersion = new Map()
    this.cacheAge = new Map()
    this.maxCacheAge = 5000 // ms
  }

  
  setCacheTTL(ms) {
    this.maxCacheAge = ms
  }

  
  getOrCompute(key, compute, options = {}) {
    const now = Date.now()
    const age = now - (this.cacheAge.get(key) || 0)
    const ttl = options.ttl || this.maxCacheAge

    if (this.cache.has(key) && age < ttl) {
      return this.cache.get(key)
    }

    const value = compute()
    this.cache.set(key, value)
    this.cacheAge.set(key, now)
    return value
  }

  
  setCached(key, value) {
    this.cache.set(key, value)
    this.cacheAge.set(key, Date.now())
  }

  
  getCached(key) {
    return this.cache.get(key)
  }

  
  clearCache(key) {
    if (key) {
      this.cache.delete(key)
      this.cacheAge.delete(key)
      this.cacheVersion.delete(key)
    } else {
      this.cache.clear()
      this.cacheAge.clear()
      this.cacheVersion.clear()
    }
  }

  
  invalidateCache() {
    this.clearCache()
  }

  
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}
