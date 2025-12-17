import { System } from '../System.js'

export class MapCollection extends System {
  constructor(world) {
    super(world)
    this.items = new Map()
  }

  get(id) {
    return this.items.get(id)
  }

  add(id, item) {
    this.items.set(id, item)
  }

  remove(id) {
    this.items.delete(id)
  }

  has(id) {
    return this.items.has(id)
  }

  clear() {
    this.items.clear()
  }

  destroy() {
    this.clear()
  }
}
