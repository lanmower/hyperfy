export class UndoManager {
  constructor() {
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
    }
  }

  hasUndos() {
    return this.undos.length > 0
  }

  clear() {
    this.undos = []
  }
}
