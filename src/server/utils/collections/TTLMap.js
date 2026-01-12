export class TTLMap {
  constructor(defaultTTL = 60000) {
    this.store = new Map()
    this.timers = new Map()
    this.defaultTTL = defaultTTL
  }

  set(key, value, ttl = this.defaultTTL) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
    }
    this.store.set(key, value)
    const timer = setTimeout(() => {
      this.delete(key)
    }, ttl)
    this.timers.set(key, timer)
  }

  get(key) {
    return this.store.get(key)
  }

  getAndExtend(key, ttl = this.defaultTTL) {
    const value = this.store.get(key)
    if (value !== undefined) {
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key))
      }
      const timer = setTimeout(() => {
        this.delete(key)
      }, ttl)
      this.timers.set(key, timer)
    }
    return value
  }

  has(key) {
    return this.store.has(key)
  }

  delete(key) {
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
    }
    return this.store.delete(key)
  }

  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.store.clear()
    this.timers.clear()
  }

  entries() {
    return this.store.entries()
  }

  keys() {
    return this.store.keys()
  }

  values() {
    return this.store.values()
  }

  get size() {
    return this.store.size
  }
}
