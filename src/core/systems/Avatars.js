import { RegistrySystemBase } from './RegistrySystemBase.js'

export class Avatars extends RegistrySystemBase {
  constructor(world) {
    super(world)
    this.cursor = 0
  }

  add(avatar) {
    const id = `avatar_${this.cursor++}`
    this.register(id, avatar)
  }

  remove(avatar) {
    for (const [id, item] of this.items.entries()) {
      if (item === avatar) {
        this.unregister(id)
        return
      }
    }
  }

  update(delta) {
    for (const avatar of this.items.values()) {
      avatar.updateRate()
      avatar.update(delta)
    }
  }
}
