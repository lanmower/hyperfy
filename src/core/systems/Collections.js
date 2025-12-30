import { RegistrySystemBase } from './RegistrySystemBase.js'

export class Collections extends RegistrySystemBase {
  constructor(world) {
    super(world)
  }

  deserialize(data) {
    this.clear()
    for (const coll of data) {
      this.register(coll.id, coll)
    }
  }

  serialize() {
    return Array.from(this.items.values())
  }
}
