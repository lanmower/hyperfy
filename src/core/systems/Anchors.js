import { RegistrySystemBase } from './RegistrySystemBase.js'

export class Anchors extends RegistrySystemBase {
  constructor(world) {
    super(world)
  }

  add(id, matrix) {
    this.register(id, matrix)
  }

  remove(id) {
    this.unregister(id)
  }
}
