/* Base class for Map/Array-based registries to eliminate duplication */

export class RegistrySystem {
  constructor(world) {
    this.world = world
    this.items = new Map()
  }

  add(key, value) {
    this.items.set(key, value)
  }

  remove(key) {
    this.items.delete(key)
  }

  get(key) {
    return this.items.get(key)
  }

  has(key) {
    return this.items.has(key)
  }

  clear() {
    this.items.clear()
  }

  getAll() {
    return Array.from(this.items.values())
  }

  size() {
    return this.items.size
  }
}
