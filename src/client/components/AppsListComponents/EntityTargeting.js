export class EntityTargeting {
  constructor(world) {
    this.world = world
    this.currentTarget = null
  }

  getClosest(item) {
    const playerPosition = this.world.rig.position
    let closestEntity
    let closestDistance = null
    for (const [_, entity] of this.world.entities.items) {
      if (entity.blueprint === item.blueprint) {
        const distance = playerPosition.distanceTo(entity.root.position)
        if (closestDistance === null || closestDistance > distance) {
          closestEntity = entity
          closestDistance = distance
        }
      }
    }
    return closestEntity
  }

  toggle(item) {
    if (this.currentTarget === item) {
      this.world.target.hide()
      this.currentTarget = null
      return
    }
    const entity = this.getClosest(item)
    if (!entity) return
    this.world.target.show(entity.root.position)
    this.currentTarget = item
  }

  hide() {
    this.world.target.hide()
    this.currentTarget = null
  }

  isTargeting(item) {
    return this.currentTarget === item
  }
}
