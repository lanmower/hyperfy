/* Lifecycle pattern extraction for 23 node types with mount/unmount/commit hooks */

export const LifecycleMixin = {
  async standardMount(onMount) {
    if (onMount) await onMount.call(this)
  },

  async standardUnmount(onUnmount) {
    if (onUnmount) await onUnmount.call(this)
  },

  standardCommit(onRebuild, onMove, didMove) {
    if (this.needsRebuild && onRebuild) {
      onRebuild.call(this)
      this.needsRebuild = false
    }
    if (didMove && onMove) {
      onMove.call(this)
    }
  }
}
