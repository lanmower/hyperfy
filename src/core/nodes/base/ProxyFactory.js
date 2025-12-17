import { getRef, secure } from '../Node.js'
import { ProxyBuilder } from '../../utils/ProxyBuilder.js'

export class ProxyFactory {
  constructor(node) {
    this.node = node
  }

  createProxy(customProps = {}) {
    if (!this.node.proxy) {
      this.node.proxy = this.getBuilder().build(customProps)
    }
    return this.node.proxy
  }

  getBuilder() {
    const self = this.node
    const builder = new ProxyBuilder(self)

    builder.addMultiple({
      id: { get: () => self.id, set: () => { throw new Error('Setting ID not currently supported') } },
      name: () => self.name,
      position: { get: () => self.position, set: () => { throw new Error('Cannot replace node position') } },
      quaternion: { get: () => self.quaternion, set: () => { throw new Error('Cannot replace node quaternion') } },
      rotation: { get: () => self.rotation, set: () => { throw new Error('Cannot replace node position') } },
      scale: { get: () => self.scale, set: () => { throw new Error('Cannot replace node scale') } },
      matrixWorld: () => self.matrixWorld,
      active: { get: () => self.active, set: (val) => { self.active = val } },
      parent: { get: () => self.parent?.getProxy(), set: () => { throw new Error('Cannot set parent directly') } },
      children: () => self.children.map(child => child.getProxy()),
      _ref: () => secure.allowRef ? self : null,
      _isRef: () => true,
      onPointerEnter: { get: () => self.onPointerEnter, set: (val) => { self.onPointerEnter = val } },
      onPointerLeave: { get: () => self.onPointerLeave, set: (val) => { self.onPointerLeave = val } },
      onPointerDown: { get: () => self.onPointerDown, set: (val) => { self.onPointerDown = val } },
      onPointerUp: { get: () => self.onPointerUp, set: (val) => { self.onPointerUp = val } },
      cursor: { get: () => self.cursor, set: (val) => { self.cursor = val } },
    })

    builder.addMethod('get', (id) => {
      const node = self.get(id)
      return node?.getProxy() || null
    })
    builder.addMethod('getWorldMatrix', (mat) => self.getWorldMatrix(mat))
    builder.addMethod('add', (pNode) => {
      const node = getRef(pNode)
      self.add(node)
      return this
    })
    builder.addMethod('remove', (pNode) => {
      const node = getRef(pNode)
      self.remove(node)
      return this
    })
    builder.addMethod('traverse', (callback) => {
      self.traverse(node => callback(node.getProxy()))
    })
    builder.addMethod('clone', (recursive) => {
      const node = self.clone(recursive)
      return node.getProxy()
    })
    builder.addMethod('clean', () => self.clean())

    return builder
  }

  buildProxy() {
    return this.getBuilder().build({})
  }

  getProxy() {
    return this.buildProxy()
  }
}
