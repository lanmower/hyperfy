// State Manager - reactive data synchronization for UI

export class StateManager {
  constructor(initialState = {}) {
    this.state = { ...initialState }
    this.watchers = new Map()
    this.computed = new Map()
    this.subscriptions = []
  }

  get(path) {
    return this._getPath(this.state, path)
  }

  set(path, value, notify = true) {
    const prev = this.get(path)
    if (prev === value) return this

    this._setPath(this.state, path, value)

    if (notify) {
      this.notify(path, value, prev)
    }
    return this
  }

  batch(updates) {
    const changes = []
    for (const [path, value] of Object.entries(updates)) {
      const prev = this.get(path)
      if (prev !== value) {
        this._setPath(this.state, path, value)
        changes.push({ path, value, prev })
      }
    }
    changes.forEach(change => this.notify(change.path, change.value, change.prev))
    return this
  }

  watch(path, callback) {
    if (!this.watchers.has(path)) {
      this.watchers.set(path, [])
    }
    this.watchers.get(path).push(callback)
    return () => this.unwatch(path, callback)
  }

  unwatch(path, callback) {
    const callbacks = this.watchers.get(path)
    if (callbacks) {
      const idx = callbacks.indexOf(callback)
      if (idx >= 0) callbacks.splice(idx, 1)
    }
    return this
  }

  computed(path, computeFn) {
    this.computed.set(path, computeFn)
    return this
  }

  getComputed(path) {
    const fn = this.computed.get(path)
    return fn ? fn(this.state) : undefined
  }

  subscribe(callback) {
    this.subscriptions.push(callback)
    return () => {
      const idx = this.subscriptions.indexOf(callback)
      if (idx >= 0) this.subscriptions.splice(idx, 1)
    }
  }

  notify(path, value, prev) {
    const callbacks = this.watchers.get(path) || []
    const allCallbacks = this.watchers.get('*') || []

    for (const callback of [...callbacks, ...allCallbacks]) {
      try {
        callback(value, prev, path)
      } catch (err) {
        console.error(`Error in watcher for ${path}:`, err)
      }
    }

    for (const callback of this.subscriptions) {
      try {
        callback({ path, value, prev })
      } catch (err) {
        console.error(`Error in subscription:`, err)
      }
    }
  }

  snapshot() {
    return JSON.parse(JSON.stringify(this.state))
  }

  reset(state = {}) {
    this.state = { ...state }
    this.watchers.clear()
    this.computed.clear()
    this.subscriptions = []
    return this
  }

  _getPath(obj, path) {
    const keys = path.split('.')
    let current = obj
    for (const key of keys) {
      current = current[key]
      if (current === undefined) return undefined
    }
    return current
  }

  _setPath(obj, path, value) {
    const keys = path.split('.')
    let current = obj
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current)) current[key] = {}
      current = current[key]
    }
    current[keys[keys.length - 1]] = value
  }

  toString() {
    return `StateManager(${Object.keys(this.state).length} properties)`
  }
}
