import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('LifecycleManager')

export class LifecycleManager {
  constructor(node) {
    this.node = node
  }

  activate(ctx) {
    const node = this.node
    if (ctx) node.ctx = ctx
    if (!node._active) return
    if (node.mounted) return
    node.updateTransform()
    node.mounted = true
    node.mount()
    const children = node.children
    for (let i = 0, l = children.length; i < l; i++) {
      children[i].activate(ctx)
    }
  }

  deactivate() {
    const node = this.node
    if (!node.mounted) return
    const children = node.children
    for (let i = 0, l = children.length; i < l; i++) {
      children[i].deactivate()
    }
    node.unmount()
    node.isDirty = false
    node.isTransformed = true
    node.mounted = false
  }

  add(node) {
    const parent = this.node
    if (!node) return logger.error('Attempted to add null or undefined node', {})
    if (node.parent) {
      node.parent.remove(node)
    }
    node.parent = parent
    parent.children.push(node)
    if (parent.mounted) {
      node.activate(parent.ctx)
    }
    return parent
  }

  remove(node) {
    const parent = this.node
    const idx = parent.children.indexOf(node)
    if (idx === -1) return
    node.deactivate()
    node.parent = null
    parent.children.splice(idx, 1)
    return parent
  }

  clean() {
    const node = this.node
    if (!node.isDirty) return
    let top = node
    while (top.parent && top.parent.isDirty) {
      top = top.parent
    }
    let didTransform
    top.traverse(n => {
      if (n.isTransformed) {
        didTransform = true
      }
      if (didTransform) {
        n.updateTransform()
      }
      if (n.mounted) {
        n.commit(didTransform)
      }
      n.isDirty = false
    })
  }

  setDirty() {
    const node = this.node
    if (!node.mounted) return
    if (node.isDirty) return
    node.isDirty = true
    node.ctx.world.stage.dirtyNodes.add(node)
  }
}
