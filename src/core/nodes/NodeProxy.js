import { ProxyBuilder } from '../utils/ProxyBuilder.js'
import { ProxyRegistry } from '../proxy/ProxyRegistry.js'

export const secure = { allowRef: false }

export function getRef(pNode) {
  if (!pNode || !pNode._isRef) return pNode
  secure.allowRef = true
  const node = pNode._ref
  secure.allowRef = false
  return node
}

export function secureRef(obj = {}, getRef) {
  const tpl = {
    get _ref() {
      if (!secure.allowRef) return null
      return getRef()
    },
  }
  obj._isRef = true
  Object.defineProperty(obj, '_ref', Object.getOwnPropertyDescriptor(tpl, '_ref'))
  return obj
}

export function buildNodeProxy(node) {
  const self = node
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

  return builder.build({})
}

export function getProxyFromRegistry(node) {
  const cached = node.proxyRegistry.getProxy(node.id)
  if (cached) return cached
  const proxy = buildNodeProxy(node)
  node.proxyRegistry.cache.set(node.id, proxy)
  return proxy
}
