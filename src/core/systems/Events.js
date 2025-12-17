import { System } from './System.js'
import { EventBus } from '../utils/events/EventBus.js'

export class Events extends System {
  constructor(world) {
    super(world)
    this.bus = new EventBus()
  }

  on(name, callback) {
    return this.bus.on(name, callback)
  }

  once(name, callback) {
    return this.bus.once(name, callback)
  }

  off(name, callback) {
    return this.bus.off(name, callback)
  }

  emit(name, ...args) {
    return this.bus.emit(name, ...args)
  }

  listenerCount(name) {
    return this.bus.listenerCount(name)
  }

  eventNames() {
    return this.bus.eventNames()
  }

  clear(name) {
    return this.bus.clear(name)
  }

  destroy() {
    this.bus.clear()
  }
}
