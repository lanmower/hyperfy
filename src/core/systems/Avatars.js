import { System } from './System.js'

export class Avatars extends System {
  constructor(world) {
    super(world)
    this.avatars = []
    this.cursor = 0
  }

  add(avatar) {
    this.avatars.push(avatar)
  }

  remove(avatar) {
    const idx = this.avatars.indexOf(avatar)
    if (idx === -1) return
    this.avatars.splice(idx, 1)
  }

  update(delta) {
    for (const avatar of this.avatars) {
      avatar.updateRate()
      avatar.update(delta)
    }
  }

  destroy() {
    this.avatars = []
  }
}
