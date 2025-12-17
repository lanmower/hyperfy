import { getRef, secure } from '../Node.js'

export class ProxyFactory {
  constructor(node) {
    this.node = node
  }

  createProxy(customProps = {}) {
    const node = this.node
    if (!node.proxy) {
      const self = node
      let proxy = customProps
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(this.buildProxy()))
      node.proxy = proxy
    }
    return node.proxy
  }

  buildProxy() {
    const self = this.node
    return {
      get id() {
        return self.id
      },
      set id(value) {
        throw new Error('Setting ID not currently supported')
      },
      get name() {
        return self.name
      },
      get position() {
        return self.position
      },
      set position(value) {
        throw new Error('Cannot replace node position')
      },
      get quaternion() {
        return self.quaternion
      },
      set quaternion(value) {
        throw new Error('Cannot replace node quaternion')
      },
      get rotation() {
        return self.rotation
      },
      set rotation(value) {
        throw new Error('Cannot replace node position')
      },
      get scale() {
        return self.scale
      },
      set scale(value) {
        throw new Error('Cannot replace node scale')
      },
      get matrixWorld() {
        return self.matrixWorld
      },
      get active() {
        return self.active
      },
      set active(value) {
        self.active = value
      },
      get parent() {
        return self.parent?.getProxy()
      },
      set parent(value) {
        throw new Error('Cannot set parent directly')
      },
      get children() {
        return self.children.map(child => {
          return child.getProxy()
        })
      },
      get(id) {
        const node = self.get(id)
        return node?.getProxy() || null
      },
      getWorldMatrix(mat) {
        return self.getWorldMatrix(mat)
      },
      add(pNode) {
        const node = getRef(pNode)
        self.add(node)
        return this
      },
      remove(pNode) {
        const node = getRef(pNode)
        self.remove(node)
        return this
      },
      traverse(callback) {
        self.traverse(node => {
          callback(node.getProxy())
        })
      },
      clone(recursive) {
        const node = self.clone(recursive)
        return node.getProxy()
      },
      clean() {
        self.clean()
      },
      get _ref() {
        if (!secure.allowRef) return null
        return self
      },
      get _isRef() {
        return true
      },
      get onPointerEnter() {
        return self.onPointerEnter
      },
      set onPointerEnter(value) {
        self.onPointerEnter = value
      },
      get onPointerLeave() {
        return self.onPointerLeave
      },
      set onPointerLeave(value) {
        self.onPointerLeave = value
      },
      get onPointerDown() {
        return self.onPointerDown
      },
      set onPointerDown(value) {
        self.onPointerDown = value
      },
      get onPointerUp() {
        return self.onPointerUp
      },
      set onPointerUp(value) {
        self.onPointerUp = value
      },
      get cursor() {
        return self.cursor
      },
      set cursor(value) {
        self.cursor = value
      },
    }
  }

  getProxy() {
    return this.buildProxy()
  }
}
