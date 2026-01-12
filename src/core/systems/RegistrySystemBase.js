/* Base registry system consolidating common register/unregister/clear patterns */

import { System } from './System.js'

export class RegistrySystemBase extends System {
  constructor(world) {
    super(world)
    this.items = new Map()
  }

  register(id, item) {
    this.items.set(id, item)
  }

  unregister(id) {
    this.items.delete(id)
  }

  get(id) {
    return this.items.get(id)
  }

  has(id) {
    return this.items.has(id)
  }

  clear() {
    this.items.clear()
  }

  [Symbol.iterator]() {
    return this.items.values()
  }

  entries() {
    return this.items.entries()
  }

  keys() {
    return this.items.keys()
  }

  values() {
    return Array.from(this.items.values())
  }

  get size() {
    return this.items.size
  }
}
