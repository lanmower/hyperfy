/* Unified builder system integrating selection, gizmo, mode, and undo */

export class BuilderCore {
  constructor() {
    this.selection = new Set()
    this.gizmo = null
    this.mode = 'select'
    this.undoStack = []
    this.redoStack = []
    this.maxUndoDepth = 100
  }

  select(entity) {
    this.selection.add(entity)
  }

  deselect(entity) {
    this.selection.delete(entity)
  }

  clearSelection() {
    this.selection.clear()
  }

  isSelected(entity) {
    return this.selection.has(entity)
  }

  setMode(mode) {
    this.mode = mode
  }

  setGizmo(gizmo) {
    this.gizmo = gizmo
  }

  pushUndo(action) {
    this.undoStack.push(action)
    this.redoStack = []
    if (this.undoStack.length > this.maxUndoDepth) {
      this.undoStack.shift()
    }
  }

  undo() {
    const action = this.undoStack.pop()
    if (action) {
      this.redoStack.push(action)
      action.undo()
    }
  }

  redo() {
    const action = this.redoStack.pop()
    if (action) {
      this.undoStack.push(action)
      action.redo()
    }
  }
}
