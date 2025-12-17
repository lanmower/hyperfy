
export class BuilderEntityPicker {
  constructor(world, builder) {
    this.world = world
    this.builder = builder
    this.stage = world.stage
  }

  getEntityAtReticle() {
    const hits = this.stage.raycastReticle()
    let entity

    for (const hit of hits) {
      entity = hit.getEntity?.()
      if (entity) break
    }

    return entity
  }

  getEntityAtPointer() {
    const hits = this.stage.raycastPointer(this.builder.control.pointer.position)
    let entity

    for (const hit of hits) {
      entity = hit.getEntity?.()
      if (entity) break
    }

    return entity
  }

  getHitAtReticle(ignoreEntity, ignorePlayers) {
    const hits = this.stage.raycastReticle()
    let hit

    for (const _hit of hits) {
      const entity = _hit.getEntity?.()
      if (entity === ignoreEntity || (entity?.isPlayer && ignorePlayers)) continue
      hit = _hit
      break
    }

    return hit
  }
}
