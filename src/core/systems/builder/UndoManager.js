import { BaseManager } from '../../patterns/index.js'

export class UndoManager extends BaseManager {
  constructor(builder) {
    super(null, 'UndoManager')
    this.builder = builder
    this.undos = []
  }

  addUndo(undo) {
    this.undos.push(undo)
  }

  undo() {
    const undo = this.undos.pop()
    if (!undo) return

    if (undo.name === 'remove-entity') {
      return { type: 'remove-entity', entityId: undo.entityId }
    } else if (undo.name === 'add-entity') {
      return { type: 'add-entity', data: undo.data }
    } else if (undo.name === 'move-entity') {
      return {
        type: 'move-entity',
        entityId: undo.entityId,
        position: undo.position,
        quaternion: undo.quaternion
      }
    }
  }

  execute() {
    const result = this.undo()
    if (!result) return
    if (this.builder.selected) this.builder.select(null)
    if (result.type === 'add-entity') {
      this.builder.entities.add(result.data, true)
      return
    }
    if (result.type === 'move-entity') {
      const entity = this.builder.entities.get(result.entityId)
      if (!entity) return
      entity.data.position = result.position
      entity.data.quaternion = result.quaternion
      this.builder.network.send('entityModified', {
        id: result.entityId,
        position: entity.data.position,
        quaternion: entity.data.quaternion,
        scale: entity.data.scale,
      })
      entity.build()
      return
    }
    if (result.type === 'remove-entity') {
      const entity = this.builder.entities.get(result.entityId)
      if (!entity) return
      entity.destroy(true)
      return
    }
  }

  hasUndos() {
    return this.undos.length > 0
  }

  clear() {
    this.undos = []
  }

  async destroyInternal() {
    this.clear()
    this.builder = null
  }
}
