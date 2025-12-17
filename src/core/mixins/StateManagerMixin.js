

export const withStateManager = (Base) => class extends Base {
  constructor(...args) {
    super(...args)
    this.state = this.getInitialState()
    this.watchers = new Map()
    this.computed = {}
    this.setupComputed(this.getComputed())
  }

  
  getInitialState() {
    return {}
  }

  
  getComputed() {
    return {}
  }

  
  setupComputed(computedDefs) {
    for (const [key, getter] of Object.entries(computedDefs)) {
      if (typeof getter === 'function') {
        Object.defineProperty(this.computed, key, {
          get: getter.bind(this),
          enumerable: true,
        })
      }
    }
  }

  
  setState(updates) {
    const oldState = { ...this.state }
    this.state = { ...this.state, ...updates }

    for (const [key, watchers] of this.watchers) {
      if (updates.hasOwnProperty(key)) {
        watchers.forEach(cb => cb(this.state[key], oldState[key]))
      }
    }
  }

  
  getState(key) {
    return key ? this.state[key] : this.state
  }

  
  watch(key, callback) {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, [])
    }
    this.watchers.get(key).push(callback)

    return () => {
      const watchers = this.watchers.get(key)
      const index = watchers.indexOf(callback)
      if (index > -1) watchers.splice(index, 1)
    }
  }

  
  getComputed(key) {
    return this.computed[key]
  }

  
  resetState() {
    this.state = this.getInitialState()
  }

  
  getStateSnapshot() {
    return { ...this.state }
  }
}
