
import { uuid } from '../utils.js'
import { StructuredLogger } from '../utils/logging/index.js'
import { DeltaCodec } from '../systems/network/DeltaCodec.js'

const logger = new StructuredLogger('BaseEntity')

export class BaseEntity {
  constructor(world, data = {}, local = false) {
    this.world = world
    this.local = local
    this.data = {
      id: data.id || uuid(),
      name: data.name || 'Entity',
      position: data.position || [0, 0, 0],
      quaternion: data.quaternion || [0, 0, 0, 1],
      ...data
    }
    this.events = new Map()
    this.state = {}

    if (local && world?.network) {
      world.network.send('entityAdded', this.data)
    }
  }

  get id() { return this.data.id }

  get position() { return this.data.position }
  set position(v) { this.data.position = v; this.markDirty() }

  get quaternion() { return this.data.quaternion }
  set quaternion(v) { this.data.quaternion = v; this.markDirty() }

  modify(updates) {
    const changes = {}
    for (const [key, value] of Object.entries(updates)) {
      if (!DeltaCodec.equals(this.data[key], value)) {
        changes[key] = value
        this.data[key] = value
      }
    }
    if (Object.keys(changes).length) {
      this.markDirty()
      this.onModified(changes)
    }
    return this
  }

  markDirty() {
    if (this.world?.network?.markDirty) {
      this.world.network.markDirty(this.id)
    }
  }

  onModified(changes) {
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
          logger.error('Error in event listener', { eventName, error: err.message })
        }
      }
    }
    return this
  }

  onEvent(version, name, data, sourceId) {
    this.emit('event', { version, name, data, sourceId })
  }

  destroy(local) {
    this.events.clear()
    this.state = {}
    if (local && this.world?.network) {
      this.world.network.send('entityRemoved', { id: this.data.id })
    }
  }

  toString() {
    return `${this.constructor.name}(${this.id}, ${this.data.name})`
  }
}
