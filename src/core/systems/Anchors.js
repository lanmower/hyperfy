import { System } from './System.js'

export class Anchors extends System {
  constructor(world) {
    super(world)
    this.matrices = new Map()
  }

  get(id) {
    return this.matrices.get(id)
  }

  add(id, matrix) {
    this.matrices.set(id, matrix)
  }

  remove(id) {
    this.matrices.delete(id)
  }

  destroy() {
    this.matrices.clear()
  }
}
