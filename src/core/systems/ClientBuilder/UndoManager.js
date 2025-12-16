// ClientBuilder undo/redo management

export class BuilderUndoManager {
  constructor(builder) {
    this.builder = builder
    this.undoStack = []
    this.redoStack = []
    this.maxStackSize = 100
  }

  record(action) {
    // Record action for undo
    this.undoStack.push(action)
    this.redoStack = [] // Clear redo when new action recorded

    // Limit stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift()
    }
  }

  undo() {
    if (this.undoStack.length === 0) return

    const action = this.undoStack.pop()
    this.redoStack.push(action)
    this.applyAction(action, true)
  }

  redo() {
    if (this.redoStack.length === 0) return

    const action = this.redoStack.pop()
    this.undoStack.push(action)
    this.applyAction(action, false)
  }

  applyAction(action, isUndo) {
    if (action.type === 'move') {
      const entity = this.builder.world.entities.get(action.entityId)
      if (entity) {
        const state = isUndo ? action.before : action.after
        entity.position.fromArray(state.position)
        entity.quaternion.fromArray(state.quaternion)
      }
    } else if (action.type === 'modify') {
      const entity = this.builder.world.entities.get(action.entityId)
      if (entity) {
        const state = isUndo ? action.before : action.after
        entity.modify(state)
      }
    }
  }

  clear() {
    this.undoStack = []
    this.redoStack = []
  }

  canUndo() {
    return this.undoStack.length > 0
  }

  canRedo() {
    return this.redoStack.length > 0
  }
}
