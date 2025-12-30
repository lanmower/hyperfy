import { isBoolean } from 'lodash-es'
import * as THREE from '../extras/three.js'
import { v, q, m } from '../utils/TempVectors.js'
import { TransformSystem } from './base/TransformSystem.js'
import { LifecycleManager } from './base/LifecycleManager.js'
import { ProxyRegistry } from '../proxy/ProxyRegistry.js'
import { ProxyBuilder } from '../utils/ProxyBuilder.js'

const _box3 = new THREE.Box3()
const _sphere = new THREE.Sphere()
const _points = []

const defaults = {
  active: true,
  position: [0, 0, 0],
  quaternion: [0, 0, 0, 1],
  scale: [1, 1, 1],
}

let nodeIds = -1

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

export class Node {
  constructor(data = {}) {
    this.id = data.id || `${++nodeIds}`
    this.name = 'node'

    this.parent = null
    this.children = []
    this.ctx = null
    this._onPointerEnter = data.onPointerEnter
    this._onPointerLeave = data.onPointerLeave
    this._onPointerDown = data.onPointerDown
    this._onPointerUp = data.onPointerUp
    this._cursor = data.cursor
    this._active = isBoolean(data.active) ? data.active : defaults.active
    this.isDirty = false
    this.isTransformed = true
    this.mounted = false
    this.transform = new TransformSystem(this)
    this.lifecycle = new LifecycleManager(this)
    this.proxyRegistry = new ProxyRegistry()
    this.transform.setupTransform(data)
  }

  activate(ctx) {
    return this.lifecycle.activate(ctx)
  }

  deactivate() {
    return this.lifecycle.deactivate()
  }

  add(node) {
    return this.lifecycle.add(node)
  }

  remove(node) {
    return this.lifecycle.remove(node)
  }

  setTransformed() {
    return this.transform.setTransformed()
  }

  setDirty() {
    return this.lifecycle.setDirty()
  }

  get active() {
    return this._active
  }

  set active(value) {
    if (this._active === value) return
    this._active = value
    if (!this._active && this.mounted) {
      this.deactivate()
    } else if (this._active && this.parent?.mounted) {
      this.activate(this.parent.ctx)
    } else if (this._active && !this.parent) {
      this.activate(this.ctx)
    }
  }

  clean() {
    return this.lifecycle.clean()
  }

  mount() {
  }

  commit(didTransform) {
  }

  unmount() {
  }

  updateTransform() {
    return this.transform.updateTransform()
  }

  traverse(callback) {
    callback(this)
    const children = this.children
    for (let i = 0, l = children.length; i < l; i++) {
      children[i].traverse(callback)
    }
  }

  clone(recursive) {
    return new this.constructor().copy(this, recursive)
  }

  copy(source, recursive) {
    this.id = source.id
    this.position.copy(source.position)
    this.quaternion.copy(source.quaternion)
    this.scale.copy(source.scale)
    this._onPointerEnter = source._onPointerEnter
    this._onPointerLeave = source._onPointerLeave
    this._onPointerDown = source._onPointerDown
    this._onPointerUp = source._onPointerUp
    this._cursor = source._cursor
    this._active = source._active
    if (recursive) {
      for (let i = 0; i < source.children.length; i++) {
        const child = source.children[i]
        this.add(child.clone(recursive))
      }
    }
    return this
  }

  copyProperties(source, propertySchema = {}) {
    for (const key in propertySchema) {
      this[`_${key}`] = source[`_${key}`]
    }
  }

  get(id) {
    if (this.id === id) return this
    for (let i = 0, l = this.children.length; i < l; i++) {
      const found = this.children[i].get(id)
      if (found) {
        return found
      }
    }
    return null
  }

  getWorldPosition(vec3) {
    return this.transform.getWorldPosition(vec3)
  }

  getWorldMatrix(mat) {
    return this.transform.getWorldMatrix(mat)
  }

  getStats(recursive, stats) {
    if (!stats) {
      stats = {
        geometries: new Set(),
        materials: new Set(),
        triangles: 0,
        textureBytes: 0,
      }
    }
    this.applyStats(stats)
    if (recursive) {
      for (const child of this.children) {
        child.getStats(recursive, stats)
      }
    }
    return stats
  }

  applyStats(stats) {
  }

  get onPointerEnter() {
    return this._onPointerEnter
  }

  set onPointerEnter(value) {
    this._onPointerEnter = value
  }

  get onPointerLeave() {
    return this._onPointerLeave
  }

  set onPointerLeave(value) {
    this._onPointerLeave = value
  }

  get onPointerDown() {
    return this._onPointerDown
  }

  set onPointerDown(value) {
    this._onPointerDown = value
  }

  get onPointerUp() {
    return this._onPointerUp
  }

  set onPointerUp(value) {
    this._onPointerUp = value
  }

  get cursor() {
    return this._cursor
  }

  set cursor(value) {
    this._cursor = value
  }

  buildNodeProxy() {
    const self = this
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

  getProxy() {
    const cached = this.proxyRegistry.getProxy(this.id)
    if (cached) return cached
    const proxy = this.buildNodeProxy()
    this.proxyRegistry.cache.set(this.id, proxy)
    return proxy
  }
}
