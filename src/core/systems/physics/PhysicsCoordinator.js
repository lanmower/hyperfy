/* Unified physics coordination for actors, callbacks, and interpolation */

import { PhysicsActorManager } from './PhysicsActorManager.js'
import { PhysicsCallbackManager } from './PhysicsCallbackManager.js'
import { PhysicsInterpolationManager } from './PhysicsInterpolationManager.js'

export class PhysicsCoordinator {
  constructor(physics) {
    this.physics = physics
    this.actors = new Map()
    this.callbacks = new Map()
    this.interpolations = new Map()
    this.actorManager = null
    this.callbackManager = new PhysicsCallbackManager()
    this.interpolationManager = null
  }

  initialize() {
    this.actorManager = new PhysicsActorManager(this.physics)
    this.interpolationManager = new PhysicsInterpolationManager(this.physics)
  }

  initializeCallbacks() {
    this.callbackManager.initializeCallbacks()
  }

  get getContactCallback() {
    return this.callbackManager.getContactCallback
  }

  get getTriggerCallback() {
    return this.callbackManager.getTriggerCallback
  }

  get contactCallbacks() {
    return this.callbackManager.contactCallbacks
  }

  get triggerCallbacks() {
    return this.callbackManager.triggerCallbacks
  }

  setQueries(queries) {
    this.queries = queries
  }

  registerActor(id, actor) {
    this.actors.set(id, actor)
    this.actorManager.register(id, actor)
  }

  unregisterActor(id) {
    this.actors.delete(id)
    this.callbacks.delete(id)
    this.interpolations.delete(id)
    this.actorManager.unregister(id)
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
