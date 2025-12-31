/* Node lifecycle boilerplate consolidation for 20+ node types */

export class LifecycleHelper {
  static markMounted(node) {
    node.needsRebuild = false
    return node
  }

  static checkAndRebuild(node, mounted, didMove) {
    if (node.needsRebuild) {
      node.unmount()
      node.mount()
      return true
    }
    if (didMove && mounted) {
      return 'moved'
    }
    return false
  }

  static async asyncMountWithToken(node, asyncFn, tokenField = 'n') {
    const token = ++node[tokenField]
    const result = await asyncFn(node, token)
    if (node[tokenField] !== token) return null
    return result
  }

  static createCleanupStack() {
    return {
      items: [],
      add(cleanup) {
        this.items.push(cleanup)
      },
      cleanup() {
        for (const fn of this.items.reverse()) {
          fn()
        }
        this.items = []
      },
    }
  }
}
