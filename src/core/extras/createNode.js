export function createNode(type, props) {
  const node = { type, props, children: [], parent: null, mounted: false, _active: true }
  node.add = function(child) {
    this.children.push(child)
    return child
  }
  node.get = function(id) {
    if (this.props?.id === id) return this
    for (const child of this.children) {
      const found = child.get?.(id)
      if (found) return found
    }
    return null
  }
  node.clone = function(deep) {
    const cloned = createNode(this.type, { ...this.props })
    if (deep) {
      for (const child of this.children) {
        cloned.add(child.clone?.(true) || { ...child })
      }
    }
    return cloned
  }
  node.getStats = function(deep) {
    return { triangles: 0, materials: new Set(), geometries: new Set(), textureBytes: 0 }
  }
  node.activate = function(options) {
    this.ctx = options
    return this
  }
  node.deactivate = function() {
    return this
  }
  node.updateTransform = function() {
    return this
  }
  node.mount = function() {
    this.mounted = true
    return this
  }
  node.unmount = function() {
    this.mounted = false
    return this
  }
  node.setDirty = function() {
    return this
  }
  node.clean = function() {
    return this
  }
  node.traverse = function(callback) {
    callback(this)
    for (const child of this.children) {
      child.traverse?.(callback)
    }
  }
  return node
}
