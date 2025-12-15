// Base Entity class - eliminates boilerplate across all entity types

import { uuid } from '../utils.js'

export class BaseEntity {
  constructor(world, data = {}) {
    this.world = world
    this.data = {
      id: data.id || uuid(),
      name: data.name || 'Entity',
      position: data.position || [0, 0, 0],
      quaternion: data.quaternion || [0, 0, 0, 1],
      ...data
    }
    this.events = new Map()
    this.state = {}
  }

  get id() { return this.data.id }

  get position() { return this.data.position }
  set position(v) { this.data.position = v; this.markDirty() }

  get quaternion() { return this.data.quaternion }
  set quaternion(v) { this.data.quaternion = v; this.markDirty() }

  modify(updates) {
    const changes = {}
    for (const [key, value] of Object.entries(updates)) {
      if (this.data[key] !== value) {
        changes[key] = value
        this.data[key] = value
      }
    }
    if (Object.keys(changes).length > 0) {
      this.markDirty()
      this.onModified(changes)
    }
    return this
  }

  markDirty() {
    if (this.world?.network) {
      this.world.network.markDirty(this.id)
    }
  }

  onModified(changes) {
    // Override in subclass
  }

  serialize() {
    return { ...this.data }
  }

  deserialize(data) {
    this.data = { ...this.data, ...data }
    return this
  }

  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, [])
    }
    this.events.get(eventName).push(callback)
    return () => this.off(eventName, callback)
  }

  off(eventName, callback) {
    const callbacks = this.events.get(eventName)
    if (callbacks) {
      const idx = callbacks.indexOf(callback)
      if (idx >= 0) callbacks.splice(idx, 1)
    }
    return this
  }

  emit(eventName, ...args) {
    const callbacks = this.events.get(eventName)
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(...args)
        } catch (err) {
          console.error(`Error in event listener for ${eventName}:`, err)
        }
      }
    }
    return this
  }

  onEvent(version, name, data, sourceId) {
    // Override in subclass for event handling
    this.emit('event', { version, name, data, sourceId })
  }

  destroy() {
    this.events.clear()
    this.state = {}
  }

  toString() {
    return `${this.constructor.name}(${this.id}, ${this.data.name})`
  }
}
