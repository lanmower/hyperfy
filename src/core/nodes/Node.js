import { isBoolean } from 'lodash-es'
import * as THREE from '../extras/three.js'
import { TransformSystem } from './base/TransformSystem.js'
import { LifecycleManager } from './base/LifecycleManager.js'
import { ProxyRegistry } from '../proxy/ProxyRegistry.js'
import { buildNodeProxy, getProxyFromRegistry } from './NodeProxy.js'
import { initializeTransform, updateTransformMatrix, getWorldPosition, getWorldMatrix, getStats } from './NodeTransform.js'

const defaults = {
  active: true,
  position: [0, 0, 0],
  quaternion: [0, 0, 0, 1],
  scale: [1, 1, 1],
}

let nodeIds = -1

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
    return getWorldPosition(this, vec3)
  }

  getWorldMatrix(mat) {
    return getWorldMatrix(this, mat)
  }

  getStats(recursive, stats) {
    return getStats(this, recursive, stats)
  }

  applyStats(stats) {
  }

  get onPointerEnter() { return this._onPointerEnter }
  set onPointerEnter(v) { this._onPointerEnter = v }
  get onPointerLeave() { return this._onPointerLeave }
  set onPointerLeave(v) { this._onPointerLeave = v }
  get onPointerDown() { return this._onPointerDown }
  set onPointerDown(v) { this._onPointerDown = v }
  get onPointerUp() { return this._onPointerUp }
  set onPointerUp(v) { this._onPointerUp = v }
  get cursor() { return this._cursor }
  set cursor(v) { this._cursor = v }

  getProxy() {
    return getProxyFromRegistry(this)
  }
}
