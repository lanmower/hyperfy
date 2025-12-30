/* Unified dirty state management mixin for rebuild/redraw triggers */

export const NodeDirtyState = {
  markRebuild() {
    this.needsRebuild = true
    this.setDirty()
  },

  markRedraw() {
    this.setDirty()
  },

  markDirty() {
    this.setDirty()
  }
}
