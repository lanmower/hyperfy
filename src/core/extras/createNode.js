export function createNode(type, props) {
  const node = {
    type,
    props,
    children: [],
    parent: null,
    mounted: false,
    _active: true,
    position: { x: 0, y: 0, z: 0, copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this }, fromArray(a) { this.x = a[0]; this.y = a[1]; this.z = a[2]; return this }, toArray() { return [this.x, this.y, this.z] } },
    quaternion: { x: 0, y: 0, z: 0, w: 1, copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; this.w = v.w; return this }, fromArray(a) { this.x = a[0]; this.y = a[1]; this.z = a[2]; this.w = a[3]; return this }, toArray() { return [this.x, this.y, this.z, this.w] } },
    scale: { x: 1, y: 1, z: 1, copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this }, fromArray(a) { this.x = a[0]; this.y = a[1]; this.z = a[2]; return this }, toArray() { return [this.x, this.y, this.z] } }
  }
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
