/* Unified state management with get/set, watchers, computed, and optional rollback */

export class StateStore {
  constructor() {
    this.state = {}
    this.watchers = new Map()
    this.computed = new Map()
    this.history = []
    this.maxHistory = 50
  }

  set(key, value) {
    const oldValue = this.state[key]
    if (oldValue === value) return

    this.state[key] = value
    this.recordHistory(key, oldValue, value)
    this.notifyWatchers(key, value, oldValue)
  }

  get(key) {
    return this.state[key]
  }

  watch(key, callback) {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, [])
    }
    this.watchers.get(key).push(callback)
  }

  addComputed(key, computeFn) {
    this.computed.set(key, computeFn)
  }

  getComputed(key) {
    const fn = this.computed.get(key)
    return fn ? fn(this.state) : null
  }

  notifyWatchers(key, newValue, oldValue) {
    const watchers = this.watchers.get(key) || []
    for (const watcher of watchers) {
      watcher(newValue, oldValue)
    }
  }

  recordHistory(key, oldValue, newValue) {
    this.history.push({ key, oldValue, newValue, timestamp: Date.now() })
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }
  }

  rollback(steps = 1) {
    for (let i = 0; i < steps && this.history.length > 0; i++) {
      const entry = this.history.pop()
      this.state[entry.key] = entry.oldValue
    }
  }

  clear() {
    this.state = {}
    this.history = []
  }
}
