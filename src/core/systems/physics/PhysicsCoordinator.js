/* Unified physics coordination for actors, callbacks, and interpolation */

export class PhysicsCoordinator {
  constructor() {
    this.actors = new Map()
    this.callbacks = new Map()
    this.interpolations = new Map()
  }

  registerActor(id, actor) {
    this.actors.set(id, actor)
  }

  unregisterActor(id) {
    this.actors.delete(id)
    this.callbacks.delete(id)
    this.interpolations.delete(id)
  }

  registerCallback(id, event, callback) {
    if (!this.callbacks.has(id)) {
      this.callbacks.set(id, new Map())
    }
    this.callbacks.get(id).set(event, callback)
  }

  invokeCallback(id, event, ...args) {
    const callbacks = this.callbacks.get(id)
    if (callbacks) {
      const callback = callbacks.get(event)
      if (callback) callback(...args)
    }
  }

  setupInterpolation(id, config) {
    this.interpolations.set(id, { ...config, value: 0 })
  }

  getInterpolation(id) {
    return this.interpolations.get(id)
  }

  update(deltaTime) {
    for (const [id, interp] of this.interpolations) {
      if (interp.duration > 0) {
        interp.value = Math.min(1, interp.value + deltaTime / interp.duration)
      }
    }
  }
}
