export class RaycastUtilities {
  constructor(builder) {
    this.builder = builder
  }

  getEntityAtReticle() {
    const hits = this.builder.world.stage.raycastReticle()
    let entity
    for (const hit of hits) {
      entity = hit.getEntity?.()
      if (entity) break
    }
    return entity
  }

  getEntityAtPointer() {
    const hits = this.builder.world.stage.raycastPointer(this.builder.control.pointer.position)
    let entity
    for (const hit of hits) {
      entity = hit.getEntity?.()
      if (entity) break
    }
    return entity
  }

  getHitAtReticle(ignoreEntity, ignorePlayers) {
    const hits = this.builder.world.stage.raycastReticle()
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
