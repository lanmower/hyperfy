import { EVENT } from '../../constants/EventNames.js'

export class EntityLifecycle {
  constructor(world, entities) {
    this.world = world
    this.entities = entities
  }

  remove(id) {
    const entity = this.entities.items.get(id)
    if (!entity) return console.warn(`tried to remove entity that did not exist: ${id}`)
    if (entity.isPlayer) this.entities.players.delete(entity.data.id)
    entity.destroy()
    this.entities.items.delete(id)
    this.entities.removed.push(id)
    this.entities.events.emit(EVENT.entity.removed, id)
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
    this.entities.items.forEach(item => {
      this.remove(item.data.id)
    })
    this.entities.items.clear()
    this.entities.players.clear()
    this.entities.hot.clear()
  }
}
