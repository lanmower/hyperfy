import { EVENT } from '../../constants/EventNames.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('EntityLifecycle')

export class EntityLifecycle {
  constructor(world, entities) {
    this.world = world
    this.entities = entities
  }

  remove(id) {
    const entity = this.entities.items.get(id)
    if (!entity) return logger.warn('Attempted to remove non-existent entity', { entityId: id })
    if (entity.isPlayer) this.entities.players.delete(entity.data.id)
    entity.destroy()
    this.entities.items.delete(id)
    this.entities.removed.push(id)
    this.entities.events?.emit(EVENT.entity.removed, id)
  }

  setHot(entity, hot) {
    if (hot) {
      this.entities.hot.add(entity)
    } else {
      this.entities.hot.delete(entity)
    }
  }

  fixedUpdate(delta) {
    for (const entity of this.entities.hot) {
      entity.fixedUpdate(delta)
    }
  }

  update(delta) {
    for (const entity of this.entities.hot) {
      entity.update(delta)
    }
  }

  lateUpdate(delta) {
    for (const entity of this.entities.hot) {
      entity.lateUpdate(delta)
    }
  }

  destroy() {
    // Create array copy before iterating to avoid modification during iteration
    const itemIds = Array.from(this.entities.items.keys())
    for (const id of itemIds) {
      this.remove(id)
    }
    this.entities.items.clear()
    this.entities.players.clear()
    this.entities.hot.clear()
  }
}
