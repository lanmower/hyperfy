import { RegistrySystemBase } from './RegistrySystemBase.js'

export class Collections extends RegistrySystemBase {
  constructor(world) {
    super(world)
  }

  deserialize(data) {
    this.clear()
    if (!Array.isArray(data)) return
    for (const coll of data) {
      if (coll && coll.id) {
        this.register(coll.id, coll)
      }
    }
  }

  serialize() {
    return Array.from(this.items.values())
  }
}
