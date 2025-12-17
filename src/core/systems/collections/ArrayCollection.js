import { System } from '../System.js'

export class ArrayCollection extends System {
  constructor(world) {
    super(world)
    this.items = []
  }

  add(item) {
    this.items.push(item)
  }

  remove(item) {
    const idx = this.items.indexOf(item)
    if (idx === -1) return false
    this.items.splice(idx, 1)
    return true
  }

  has(item) {
    return this.items.includes(item)
  }

  clear() {
    this.items = []
  }

  destroy() {
    this.clear()
  }
}
