export class UndoOperationExecutor {
  constructor(parent) {
    this.parent = parent
  }

  execute() {
    const result = this.parent.undoManager.undo()
    if (!result) return
    if (this.parent.selected) this.parent.select(null)
    if (result.type === 'add-entity') {
      this.parent.entities.add(result.data, true)
      return
    }
    if (result.type === 'move-entity') {
      const entity = this.parent.entities.get(result.entityId)
      if (!entity) return
      entity.data.position = result.position
      entity.data.quaternion = result.quaternion
      this.parent.network.send('entityModified', {
        id: result.entityId,
        position: entity.data.position,
        quaternion: entity.data.quaternion,
        scale: entity.data.scale,
      })
      entity.build()
      return
    }
    if (result.type === 'remove-entity') {
      const entity = this.parent.entities.get(result.entityId)
      if (!entity) return
      entity.destroy(true)
      return
    }
  }
}
