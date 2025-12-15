// Unified event bus for system communication

export class EventBus {
  constructor() {
    this.listeners = new Map()
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)
    return () => this.off(event, callback)
  }

  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args)
      this.off(event, wrapper)
    }
    return this.on(event, wrapper)
  }

  off(event, callback) {
    const set = this.listeners.get(event)
    if (set) set.delete(callback)
  }

  emit(event, ...args) {
    const set = this.listeners.get(event)
    if (!set) return
    for (const callback of set) {
      try {
        callback(...args)
      } catch (err) {
        console.error(`Event listener error for '${event}':`, err)
      }
    }
  }

  clear(event) {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }

  listenerCount(event) {
    return this.listeners.get(event)?.size || 0
  }

  eventNames() {
    return Array.from(this.listeners.keys())
  }
}

// Singleton event bus for global communication
export const globalEvents = new EventBus()
