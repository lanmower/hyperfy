
export class Cache {
  constructor(maxSize = 100, ttl = 60000) {
    this.maxSize = maxSize
    this.ttl = ttl
    this.cache = new Map()
    this.timestamps = new Map()
  }

  set(key, value, ttl = this.ttl) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
      this.timestamps.delete(firstKey)
    }
    this.cache.set(key, value)
    this.timestamps.set(key, Date.now() + ttl)
  }

  get(key) {
    const expiry = this.timestamps.get(key)
    if (expiry && expiry < Date.now()) {
      this.cache.delete(key)
      this.timestamps.delete(key)
      return null
    }
    return this.cache.get(key)
  }

  has(key) {
    return this.get(key) !== undefined
  }

  delete(key) {
    this.cache.delete(key)
    this.timestamps.delete(key)
  }

  clear() {
    this.cache.clear()
    this.timestamps.clear()
  }

  memoize(fn, keyFn = (...args) => JSON.stringify(args)) {
    return (...args) => {
      const key = keyFn(...args)
      const cached = this.get(key)
      if (cached !== undefined) return cached
      const result = fn(...args)
      this.set(key, result)
      return result
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      entries: Array.from(this.cache.keys())
    }
  }

  toString() {
    return `Cache(${this.cache.size}/${this.maxSize}, ttl=${this.ttl}ms)`
  }
}
