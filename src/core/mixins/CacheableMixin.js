/**
 * Cacheable Mixin
 *
 * Provides automatic caching capabilities to any system or service.
 * Useful for systems that compute expensive values.
 *
 * Usage:
 *   class MySystem extends withCacheable(System) {
 *     computeValue(key) {
 *       return expensiveComputation(key)
 *     }
 *   }
 *
 *   const system = new MySystem(world)
 *   const result = system.getOrCompute('key1', () => system.computeValue('key1'))
 */

export const withCacheable = (Base) => class extends Base {
  constructor(...args) {
    super(...args)
    this.cache = new Map()
    this.cacheVersion = new Map()
    this.cacheAge = new Map()
    this.maxCacheAge = 5000 // ms
  }

  /**
   * Set cache TTL (time to live)
   * @param {number} ms - Milliseconds
   */
  setCacheTTL(ms) {
    this.maxCacheAge = ms
  }

  /**
   * Get or compute a value
   * @param {string} key - Cache key
   * @param {Function} compute - Computation function
   * @param {Object} options - { ttl: number }
   * @returns {any} Cached or computed value
   */
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

  /**
   * Set a cache value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   */
  setCached(key, value) {
    this.cache.set(key, value)
    this.cacheAge.set(key, Date.now())
  }

  /**
   * Get a cached value
   * @param {string} key - Cache key
   * @returns {any} Cached value or undefined
   */
  getCached(key) {
    return this.cache.get(key)
  }

  /**
   * Clear a cache entry
   * @param {string} key - Cache key
   */
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

  /**
   * Invalidate cache (clear it)
   */
  invalidateCache() {
    this.clearCache()
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}
