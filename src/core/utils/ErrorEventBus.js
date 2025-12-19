import { createErrorEvent, isSameError, mergeErrorEvents } from '../schemas/ErrorEvent.schema.js'

export class ErrorEventBus {
  constructor() {
    this.listeners = []
    this.cache = new Map()
    this.stats = {
      total: 0,
      unique: 0,
      duplicates: 0
    }
  }

  register(handler) {
    this.listeners.push(handler)
  }

  unregister(handler) {
    this.listeners = this.listeners.filter(l => l !== handler)
  }

  emit(error, context = {}, level) {
    const event = createErrorEvent(error, context, level)
    const isDuplicate = this.checkDuplicate(event)

    if (isDuplicate) {
      this.stats.duplicates++
    } else {
      this.stats.unique++
    }
    this.stats.total++

    this.listeners.forEach(listener => {
      try {
        listener(event, isDuplicate)
      } catch (err) {
        console.error('ErrorEventBus listener error:', err)
      }
    })
  }

  checkDuplicate(event) {
    for (const [, cached] of this.cache) {
      if (isSameError(cached, event)) {
        const merged = mergeErrorEvents(cached, event)
        this.cache.set(cached.id, merged)
        return true
      }
    }
    this.cache.set(event.id, event)
    if (this.cache.size > 1000) {
      const oldest = this.cache.keys().next().value
      this.cache.delete(oldest)
    }
    return false
  }

  getStats() {
    return {
      total: this.stats.total,
      unique: this.stats.unique,
      duplicates: this.stats.duplicates,
      cached: this.cache.size
    }
  }

  clear() {
    this.cache.clear()
    this.stats = {
      total: 0,
      unique: 0,
      duplicates: 0
    }
  }
}
