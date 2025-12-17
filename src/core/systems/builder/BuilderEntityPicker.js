/**
 * Builder Entity Picker
 *
 * Handles raycasting and entity selection for builder operations.
 * Responsibilities:
 * - Picking entities at reticle (center of screen)
 * - Picking entities at pointer (mouse position)
 * - Raycasting hits at reticle with filtering
 */

export class BuilderEntityPicker {
  constructor(world, builder) {
    this.world = world
    this.builder = builder
  }

  /**
   * Get entity at center of screen (reticle)
   */
  getEntityAtReticle() {
    const hits = this.world.stage.raycastReticle()
    let entity

    for (const hit of hits) {
      entity = hit.getEntity?.()
      if (entity) break
    }

    return entity
  }

  /**
   * Get entity at pointer position (mouse)
   */
  getEntityAtPointer() {
    const hits = this.world.stage.raycastPointer(this.builder.control.pointer.position)
    let entity

    for (const hit of hits) {
      entity = hit.getEntity?.()
      if (entity) break
    }

    return entity
  }

  /**
   * Get raycast hit at reticle with optional entity filtering
   */
  getHitAtReticle(ignoreEntity, ignorePlayers) {
    const hits = this.world.stage.raycastReticle()
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
