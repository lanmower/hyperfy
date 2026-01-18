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
     // Update hot entities (frequent updates)
     for (const entity of this.entities.hot) {
       if (entity.fixedUpdate) entity.fixedUpdate(delta)
     }
     // Also update all entities that might need fixed updates
     for (const entity of this.entities.items.values()) {
       if (!this.entities.hot.has(entity) && entity.fixedUpdate) {
         entity.fixedUpdate(delta)
       }
     }
   }

   update(delta) {
     // Update hot entities (frequent updates)
     for (const entity of this.entities.hot) {
       if (entity.update) entity.update(delta)
     }
     // Also update all entities that might need updates
     for (const entity of this.entities.items.values()) {
       if (!this.entities.hot.has(entity) && entity.update) {
         entity.update(delta)
       }
     }
   }

   lateUpdate(delta) {
     // Update hot entities (frequent updates)
     for (const entity of this.entities.hot) {
       if (entity.lateUpdate) entity.lateUpdate(delta)
     }
     // Also update all entities that might need late updates
     for (const entity of this.entities.items.values()) {
       if (!this.entities.hot.has(entity) && entity.lateUpdate) {
         entity.lateUpdate(delta)
       }
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
