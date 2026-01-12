import { Plugin } from '../Plugin.js'

export class AnchorsPlugin extends Plugin {
  constructor(world, options = {}) {
    super(world, options)
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

  async destroy() {
    this.matrices.clear()
  }

  getAPI() {
    return {
      get: (id) => this.get(id),
      add: (id, matrix) => this.add(id, matrix),
      remove: (id) => this.remove(id),
    }
  }
}
