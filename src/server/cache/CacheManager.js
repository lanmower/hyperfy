import { BaseManager } from '../../core/patterns/index.js'
import LRU from 'lru-cache'

export class CacheManager extends BaseManager {
  constructor(maxSize = 1000, defaultTTL = null) {
    super(null, 'CacheManager')
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
    this.cache = new LRU({ max: maxSize, ttl: defaultTTL })
    this.stats = { hits: 0, misses: 0, evictions: 0, sets: 0, deletes: 0 }
    this.invalidationCallbacks = new Map()
    this._startMemoryMonitor()
  }

  _startMemoryMonitor() {
    const interval = setInterval(() => {
      const stats = this.getStats()
      const memMatch = stats.memoryUsage.match(/(\d+\.\d+)/)
      const mb = parseFloat(memMatch?.[1] || 0)
      if (mb > 100) {
        this.logger.warn(`Memory usage high: ${mb}MB`)
      }
    }, 30000)
    this.registerResource({ dispose: () => clearInterval(interval) })
  }

  get(key) {
    const value = this.cache.get(key)
    if (value === undefined) {
      this.stats.misses++
    } else {
      this.stats.hits++
    }
    return value
  }

  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, value, { ttl })
    this.stats.sets++
    return value
  }

  delete(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
      this.stats.deletes++
    }
  }

  invalidate(pattern) {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key)
      }
    }
    const callbacks = this.invalidationCallbacks.get(pattern) || []
    for (const cb of callbacks) {
      cb()
    }
  }

  onInvalidate(pattern, callback) {
    if (!this.invalidationCallbacks.has(pattern)) {
      this.invalidationCallbacks.set(pattern, [])
    }
    this.invalidationCallbacks.get(pattern).push(callback)
  }

  clear() {
    this.cache.clear()
  }

  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      maxSize: this.maxSize,
      memoryUsage: this._estimateMemory(),
    }
  }

  _estimateMemory() {
    let bytes = 0
    for (const key of this.cache.keys()) {
      const value = this.cache.get(key)
      bytes += key.length * 2
      if (typeof value === 'string') {
        bytes += value.length * 2
      } else if (typeof value === 'object') {
        bytes += JSON.stringify(value).length * 2
      } else {
        bytes += 8
      }
    }
    const mb = (bytes / 1024 / 1024).toFixed(2)
    return `${mb}MB`
  }

  async initInternal() {
  }

  async destroyInternal() {
    this.clear()
    this.invalidationCallbacks.clear()
  }
}

export default CacheManager
