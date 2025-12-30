import { BaseManager } from '../../core/patterns/BaseManager.js'

class LRUNode {
  constructor(key, value, ttl) {
    this.key = key
    this.value = value
    this.expiry = ttl ? Date.now() + ttl : null
    this.prev = null
    this.next = null
  }

  isExpired() {
    return this.expiry && Date.now() > this.expiry
  }
}

export class CacheManager extends BaseManager {
  constructor(maxSize = 1000, defaultTTL = null) {
    super(null, 'CacheManager')
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
    this.cache = new Map()
    this.head = new LRUNode(null, null)
    this.tail = new LRUNode(null, null)
    this.head.next = this.tail
    this.tail.prev = this.head
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      sets: 0,
      deletes: 0,
    }
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
    const node = this.cache.get(key)
    if (!node) {
      this.stats.misses++
      return undefined
    }

    if (node.isExpired()) {
      this._removeNode(node)
      this.cache.delete(key)
      this.stats.misses++
      return undefined
    }

    this._moveToFront(node)
    this.stats.hits++
    return node.value
  }

  set(key, value, ttl = this.defaultTTL) {
    let node = this.cache.get(key)

    if (node) {
      node.value = value
      node.expiry = ttl ? Date.now() + ttl : null
      this._moveToFront(node)
    } else {
      node = new LRUNode(key, value, ttl)
      this._addToFront(node)
      this.cache.set(key, node)

      if (this.cache.size > this.maxSize) {
        const removed = this.tail.prev
        this._removeNode(removed)
        this.cache.delete(removed.key)
        this.stats.evictions++
      }
    }

    this.stats.sets++
    return value
  }

  delete(key) {
    const node = this.cache.get(key)
    if (node) {
      this._removeNode(node)
      this.cache.delete(key)
      this.stats.deletes++
    }
  }

  invalidate(pattern) {
    const keys = Array.from(this.cache.keys())
    const regex = new RegExp(pattern)
    for (const key of keys) {
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
    this.head.next = this.tail
    this.tail.prev = this.head
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

  _moveToFront(node) {
    this._removeNode(node)
    this._addToFront(node)
  }

  _addToFront(node) {
    node.prev = this.head
    node.next = this.head.next
    this.head.next.prev = node
    this.head.next = node
  }

  _removeNode(node) {
    node.prev.next = node.next
    node.next.prev = node.prev
  }

  _estimateMemory() {
    let bytes = 0
    for (const [key, node] of this.cache) {
      bytes += key.length * 2
      if (typeof node.value === 'string') {
        bytes += node.value.length * 2
      } else if (typeof node.value === 'object') {
        bytes += JSON.stringify(node.value).length * 2
      } else {
        bytes += 8
      }
    }
    const mb = (bytes / 1024 / 1024).toFixed(2)
    return `${mb}MB`
  }

}

export default CacheManager
