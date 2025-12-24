export class EntityTargeting {
  constructor(world) {
    this.world = world
    this.currentTarget = null
  }

  getClosest(item) {
    const players = Array.from(this.world.entities.items.values()).filter(e => e.isPlayer)
    const localPlayer = players.find(p => p.isLocal) || players[0]
    const playerPosition = localPlayer?.base?.position
    if (!playerPosition) {
      console.warn('[EntityTargeting.getClosest] No player position found')
      return null
    }

    let closestEntity
    let closestDistance = null
    const allEntities = Array.from(this.world.entities.items.values())
    const blueprintId = item.blueprint?.id || item.blueprint
    const matchingEntities = allEntities.filter(e => {
      const entityBlueprintId = e.blueprint?.id || e.blueprint
      return entityBlueprintId === blueprintId && e.root?.position && e.isApp
    })

    for (const entity of matchingEntities) {
      const distance = playerPosition.distanceTo(entity.root.position)
      if (closestDistance === null || closestDistance > distance) {
        closestEntity = entity
        closestDistance = distance
      }
    }

    if (!closestEntity) {
      console.warn('[EntityTargeting.getClosest] No matching app entity found for blueprint:', blueprintId, 'Found', matchingEntities.length, 'matching entities')
    }
    return closestEntity
  }

  toggle(item) {
    if (this.currentTarget === item) {
      this.world.target?.hide()
      this.currentTarget = null
      return
    }
    const entity = this.getClosest(item)
    if (!entity) return
    this.world.target?.show(entity.root.position)
    this.currentTarget = item
  }

  hide() {
    this.world.target?.hide()
    this.currentTarget = null
  }

  isTargeting(item) {
    return this.currentTarget === item
  }
}
