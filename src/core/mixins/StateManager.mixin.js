/**
 * State Manager Mixin
 *
 * Provides declarative state management with watchers and computed properties.
 * Reduces boilerplate for systems that manage complex state.
 *
 * Usage:
 *   class MySystem extends withStateManager(System) {
 *     getInitialState() {
 *       return { count: 0, name: 'test' }
 *     }
 *
 *     getComputed() {
 *       return {
 *         doubled: () => this.state.count * 2
 *       }
 *     }
 *   }
 *
 *   const system = new MySystem(world)
 *   system.setState({ count: 5 })
 */

export const withStateManager = (Base) => class extends Base {
  constructor(...args) {
    super(...args)
    this.state = this.getInitialState()
    this.watchers = new Map()
    this.computed = {}
    this.setupComputed(this.getComputed())
  }

  /**
   * Override to provide initial state
   * @returns {Object} Initial state
   */
  getInitialState() {
    return {}
  }

  /**
   * Override to provide computed properties
   * @returns {Object} Computed property definitions
   */
  getComputed() {
    return {}
  }

  /**
   * Set up computed properties
   * @param {Object} computedDefs - Definitions of computed properties
   */
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

  /**
   * Update state
   * @param {Object} updates - Partial state updates
   */
  setState(updates) {
    const oldState = { ...this.state }
    this.state = { ...this.state, ...updates }

    // Trigger watchers
    for (const [key, watchers] of this.watchers) {
      if (updates.hasOwnProperty(key)) {
        watchers.forEach(cb => cb(this.state[key], oldState[key]))
      }
    }
  }

  /**
   * Get a state value
   * @param {string} key - State key
   * @returns {any} State value
   */
  getState(key) {
    return key ? this.state[key] : this.state
  }

  /**
   * Watch a state property
   * @param {string} key - Property to watch
   * @param {Function} callback - Called when property changes
   * @returns {Function} Unwatch function
   */
  watch(key, callback) {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, [])
    }
    this.watchers.get(key).push(callback)

    // Return unwatch function
    return () => {
      const watchers = this.watchers.get(key)
      const index = watchers.indexOf(callback)
      if (index > -1) watchers.splice(index, 1)
    }
  }

  /**
   * Get computed value
   * @param {string} key - Computed property key
   * @returns {any} Computed value
   */
  getComputed(key) {
    return this.computed[key]
  }

  /**
   * Reset state to initial
   */
  resetState() {
    this.state = this.getInitialState()
  }

  /**
   * Get state snapshot
   * @returns {Object} Copy of current state
   */
  getStateSnapshot() {
    return { ...this.state }
  }
}
