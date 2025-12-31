export class EntityTargeting {
  constructor(world) {
    this.world = world
    this.currentTarget = null
  }

  getClosest(item) {
    const players = Array.from(this.world.entities.items.values()).filter(e => e.isPlayer)
    const localPlayer = players.find(p => p.isLocal) || players[0]
    const playerPosition = localPlayer?.base?.position
    if (!playerPosition) return null

    let closestEntity
    let closestDistance = null
    const allEntities = Array.from(this.world.entities.items.values())
    const blueprintId = item.blueprint?.id || item.blueprint

    const appEntities = allEntities.filter(e => e.isApp)
    const matchingEntities = appEntities.filter(e => {
      const entityBlueprintId = e.data?.blueprint || e.blueprint?.id || e.blueprint
      const hasPosition = !!e.position || !!e.data?.position
      return entityBlueprintId === blueprintId && hasPosition
    })

    for (const entity of matchingEntities) {
      const entityPos = entity.position || entity.data?.position
      let distance
      if (Array.isArray(entityPos)) {
        const dx = playerPosition.x - entityPos[0]
        const dy = playerPosition.y - entityPos[1]
        const dz = playerPosition.z - entityPos[2]
        distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
      } else {
        distance = playerPosition.distanceTo(entityPos)
      }
      if (closestDistance === null || closestDistance > distance) {
        closestEntity = entity
        closestDistance = distance
      }
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
    const entityPos = entity.position || entity.data?.position
    const posToShow = Array.isArray(entityPos) ? { x: entityPos[0], y: entityPos[1], z: entityPos[2] } : entityPos
    this.world.target?.show(posToShow)
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
