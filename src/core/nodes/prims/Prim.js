import * as THREE from '../../extras/three.js'
import { isBoolean, isNumber, isString, isArray, isObject, isFunction, isEqual } from 'lodash-es'
import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'
import { Node } from '../Node.js'
import { defaults, defaultSizes, types } from './PrimDefaults.js'
import { getGeometry, getGeometryConfig } from './PrimGeometry.js'
import { getMaterial, applyTexture, quantizeOpacity } from './PrimMaterial.js'
import { mountPhysics, unmountPhysics, getColliderSize } from './PrimPhysics.js'
import { createPrimProxy } from './PrimProxy.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'

const logger = new ComponentLogger('Prim')

const { v1: _v1, v2: _v2, q1: _q1, m1: _m1, m2: _m2, m3: _m3 } = SharedVectorPool('Prim', 2, 1, 0, 3)
const _defaultScale = new THREE.Vector3(1, 1, 1)

let count = 0

if (typeof window !== 'undefined') {
  window.prims = {
    get count() {
      return count
    },
  }
}

export class Prim extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'prim'

    this.type = data.type
    this.size = data.size
    this.color = data.color
    this.emissive = data.emissive
    this.emissiveIntensity = data.emissiveIntensity
    this.metalness = data.metalness
    this.roughness = data.roughness
    this.opacity = data.opacity
    this.texture = data.texture
    this.castShadow = data.castShadow
    this.receiveShadow = data.receiveShadow
    this.doubleside = data.doubleside
    this.physics = data.physics
    this.mass = data.mass
    this.linearDamping = data.linearDamping
    this.angularDamping = data.angularDamping
    this.staticFriction = data.staticFriction
    this.dynamicFriction = data.dynamicFriction
    this.restitution = data.restitution
    this.layer = data.layer
    this.trigger = data.trigger
    this.tag = data.tag
    this.onContactStart = data.onContactStart
    this.onContactEnd = data.onContactEnd
    this.onTriggerEnter = data.onTriggerEnter
    this.onTriggerLeave = data.onTriggerLeave

    this.shapes = new Set()
    this._tm = null
    this.tempVec3 = new THREE.Vector3()
    this.tempQuat = new THREE.Quaternion()

    this.matrixWorldOffset = new THREE.Matrix4()
    this.scaleOffset = new THREE.Vector3()
    this.n = 0
    this._geometrySize = null
  }

  async mount() {
    this.needsRebuild = false

    const { size, scaleOffset } = getGeometryConfig(this._type, this._size)
    this._geometrySize = size
    this.scaleOffset.fromArray(scaleOffset)
    this.updateMatrixWorldOffset()

    const geometry = getGeometry(this._type, size)

    const material = getMaterial({
      metalness: this._metalness,
      roughness: this._roughness,
      opacity: quantizeOpacity(this._opacity),
      texture: this._texture,
      doubleside: this._doubleside,
    })

    const loader = this.ctx.world.loader || null

    if (this._texture && !material._texApplied) {
      const n = ++this.n
      await applyTexture(material, this._texture, loader)
      if (n !== this.n) return
    }

    if (this._opacity > 0) {
      this.handle = this.ctx.world.stage.insertLinked({
        geometry,
        material,
        uberShader: true,
        castShadow: this._castShadow,
        receiveShadow: this._receiveShadow,
        matrix: this.matrixWorldOffset,
        node: this,
      })
      this.handle.setColor(this._color)
      this.handle.setEmissive(this._emissive)
      this.handle.setEmissiveIntensity(this._emissiveIntensity)
      count++
    } else {
      this.sItem = {
        matrix: this.matrixWorldOffset,
        geometry,
        material,
        getEntity: () => this.ctx.entity,
        node: this,
      }
      this.ctx.world.stage.octree.insert(this.sItem)
      count++
    }

    if (this._physics && !this.ctx.entity?.moving) {
      mountPhysics(this)
    }
  }

  onInterpolate = (position, quaternion) => {
    if (this.parent) {
      _m1.compose(position, quaternion, _defaultScale)
      _m2.copy(this.parent.matrixWorld).invert()
      _m3.multiplyMatrices(_m2, _m1)
      _m3.decompose(this.position, this.quaternion, _v1)
    } else {
      this.position.copy(position)
      this.quaternion.copy(quaternion)
    }
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
      return
    }
    if (didMove) {
      this.updateMatrixWorldOffset()
      if (this.handle) {
        this.handle.move(this.matrixWorldOffset)
      }
      if (this.actorHandle) {
        this.actorHandle.move(this.matrixWorldOffset)
      }
      if (this.sItem) {
        this.ctx.world.stage.octree.move(this.sItem)
      }
    }
  }

  unmount() {
    this.n++
    if (this.handle) {
      this.handle.destroy()
      this.handle = null
      count--
    }
    if (this.sItem) {
      this.ctx.world.stage.octree.remove(this.sItem)
      if (this.sItem.material) {
        this.sItem.material.dispose()
      }
      this.sItem = null
    }
    unmountPhysics(this)
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    this._type = source._type
    this._size = source._size
    this._color = source._color
    this._emissive = source._emissive
    this._emissiveIntensity = source._emissiveIntensity
    this._metalness = source._metalness
    this._roughness = source._roughness
    this._opacity = source._opacity
    this._texture = source._texture
    this._castShadow = source._castShadow
    this._receiveShadow = source._receiveShadow
    this._doubleside = source._doubleside
    this._physics = source._physics
    this._mass = source._mass
    this._linearDamping = source._linearDamping
    this._angularDamping = source._angularDamping
    this._staticFriction = source._staticFriction
    this._dynamicFriction = source._dynamicFriction
    this._restitution = source._restitution
    this._layer = source._layer
    this._trigger = source._trigger
    this._tag = source._tag
    this._onContactStart = source._onContactStart
    this._onContactEnd = source._onContactEnd
    this._onTriggerEnter = source._onTriggerEnter
    this._onTriggerLeave = source._onTriggerLeave
    return this
  }

  updateMatrixWorldOffset() {
    this.matrixWorld.decompose(_v1, _q1, _v2)
    _v2.multiply(this.scaleOffset)
    this.matrixWorldOffset.compose(_v1, _q1, _v2)
  }

  get type() {
    return this._type
  }

  set type(value = defaults.type) {
    if (!isString(value) || !types.includes(value)) {
      throw new Error('[prim] type invalid')
    }
    if (this._type === value) return
    this._type = value
    this.needsRebuild = true
    this.setDirty()
  }

  get size() {
    return this._size
  }

  set size(value) {
    if (value === null || value === undefined) {
      value = defaultSizes[this._type].slice()
    }
    if (!isArray(value)) {
      throw new Error('[prim] size must be an array')
    }
    if (isEqual(this._size, value)) return
    this._size = value
    this.needsRebuild = true
    this.setDirty()
  }

  get color() {
    return this._color
  }

  set color(value = defaults.color) {
    if (!isString(value)) {
      throw new Error('[prim] color must be string')
    }
    if (this._color === value) return
    this._color = value
    this.handle?.setColor(value)
  }

  get emissive() {
    return this._emissive
  }

  set emissive(value = defaults.emissive) {
    if (value !== null && !isString(value)) {
      throw new Error('[prim] emissive must be string or null')
    }
    if (this._emissive === value) return
    this._emissive = value
    this.handle?.setEmissive(value)
  }

  get castShadow() {
    return this._castShadow
  }

  set castShadow(value = defaults.castShadow) {
    if (!isBoolean(value)) {
      throw new Error('[prim] castShadow not a boolean')
    }
    if (this._castShadow === value) return
    this._castShadow = value
    this.needsRebuild = true
    this.setDirty()
  }

  get receiveShadow() {
    return this._receiveShadow
  }

  set receiveShadow(value = defaults.receiveShadow) {
    if (!isBoolean(value)) {
      throw new Error('[prim] receiveShadow not a boolean')
    }
    if (this._receiveShadow === value) return
    this._receiveShadow = value
    this.needsRebuild = true
    this.setDirty()
  }

  get emissiveIntensity() {
    return this._emissiveIntensity
  }

  set emissiveIntensity(value = defaults.emissiveIntensity) {
    if (!isNumber(value) || value < 0) {
      throw new Error('[prim] emissiveIntensity must be positive number')
    }
    if (this._emissiveIntensity === value) return
    this._emissiveIntensity = value
    this.handle?.setEmissiveIntensity(value)
  }

  get metalness() {
    return this._metalness
  }

  set metalness(value = defaults.metalness) {
    if (!isNumber(value) || value < 0 || value > 1) {
      throw new Error('[prim] metalness must be number between 0 and 1')
    }
    if (this._metalness === value) return
    this._metalness = value
    this.needsRebuild = true
    this.setDirty()
  }

  get roughness() {
    return this._roughness
  }

  set roughness(value = defaults.roughness) {
    if (!isNumber(value) || value < 0 || value > 1) {
      throw new Error('[prim] roughness must be number between 0 and 1')
    }
    if (this._roughness === value) return
    this._roughness = value
    this.needsRebuild = true
    this.setDirty()
  }

  get opacity() {
    return this._opacity
  }

  set opacity(value = defaults.opacity) {
    if (!isNumber(value) || value < 0 || value > 1) {
      throw new Error('[prim] opacity must be number between 0 and 1')
    }
    if (this._opacity === value) return
    this._opacity = value
    this.needsRebuild = true
    this.setDirty()
  }

  get texture() {
    return this._texture
  }

  set texture(value = defaults.texture) {
    if (value !== null && !isString(value)) {
      throw new Error('[prim] texture must be string or null')
    }
    if (this._texture === value) return
    this._texture = value
    this.needsRebuild = true
    this.setDirty()
  }

  get physics() {
    return this._physics
  }

  set physics(value = defaults.physics) {
    if (value !== null && value !== 'static' && value !== 'kinematic' && value !== 'dynamic') {
      throw new Error('[prim] physics must be null, "static", "kinematic", or "dynamic"')
    }
    if (this._physics === value) return
    this._physics = value
    this.needsRebuild = true
    this.setDirty()
  }

  get mass() {
    return this._mass
  }

  set mass(value = defaults.mass) {
    if (!isNumber(value) || value <= 0) {
      throw new Error('[prim] mass must be positive number')
    }
    if (this._mass === value) return
    this._mass = value
    this.needsRebuild = true
    this.setDirty()
  }

  get linearDamping() {
    return this._linearDamping
  }

  set linearDamping(value = defaults.linearDamping) {
    if (!isNumber(value) || value < 0) {
      throw new Error('[prim] linearDamping must be non-negative number')
    }
    if (this._linearDamping === value) return
    this._linearDamping = value
    this.needsRebuild = true
    this.setDirty()
  }

  get angularDamping() {
    return this._angularDamping
  }

  set angularDamping(value = defaults.angularDamping) {
    if (!isNumber(value) || value < 0) {
      throw new Error('[prim] angularDamping must be non-negative number')
    }
    if (this._angularDamping === value) return
    this._angularDamping = value
    this.needsRebuild = true
    this.setDirty()
  }

  get staticFriction() {
    return this._staticFriction
  }

  set staticFriction(value = defaults.staticFriction) {
    if (!isNumber(value) || value < 0 || value > 1) {
      throw new Error('[prim] staticFriction must be number between 0 and 1')
    }
    if (this._staticFriction === value) return
    this._staticFriction = value
    this.needsRebuild = true
    this.setDirty()
  }

  get dynamicFriction() {
    return this._dynamicFriction
  }

  set dynamicFriction(value = defaults.dynamicFriction) {
    if (!isNumber(value) || value < 0 || value > 1) {
      throw new Error('[prim] dynamicFriction must be number between 0 and 1')
    }
    if (this._dynamicFriction === value) return
    this._dynamicFriction = value
    this.needsRebuild = true
    this.setDirty()
  }

  get restitution() {
    return this._restitution
  }

  set restitution(value = defaults.restitution) {
    if (!isNumber(value) || value < 0 || value > 1) {
      throw new Error('[prim] restitution must be number between 0 and 1')
    }
    if (this._restitution === value) return
    this._restitution = value
    this.needsRebuild = true
    this.setDirty()
  }

  get layer() {
    return this._layer
  }

  set layer(value = defaults.layer) {
    if (!isString(value)) {
      throw new Error('[prim] layer must be string')
    }
    if (this._layer === value) return
    this._layer = value
    this.needsRebuild = true
    this.setDirty()
  }

  get trigger() {
    return this._trigger
  }

  set trigger(value = defaults.trigger) {
    if (!isBoolean(value)) {
      throw new Error('[prim] trigger must be boolean')
    }
    if (this._trigger === value) return
    this._trigger = value
    this.needsRebuild = true
    this.setDirty()
  }

  get tag() {
    return this._tag
  }

  set tag(value = defaults.tag) {
    if (value !== null && !isString(value)) {
      throw new Error('[prim] tag must be string or null')
    }
    if (this._tag === value) return
    this._tag = value
  }

  get onContactStart() {
    return this._onContactStart
  }

  set onContactStart(value = defaults.onContactStart) {
    if (value !== null && typeof value !== 'function') {
      throw new Error('[prim] onContactStart must be function or null')
    }
    this._onContactStart = value
  }

  get onContactEnd() {
    return this._onContactEnd
  }

  set onContactEnd(value = defaults.onContactEnd) {
    if (value !== null && typeof value !== 'function') {
      throw new Error('[prim] onContactEnd must be function or null')
    }
    this._onContactEnd = value
  }

  get onTriggerEnter() {
    return this._onTriggerEnter
  }

  set onTriggerEnter(value = defaults.onTriggerEnter) {
    if (value !== null && typeof value !== 'function') {
      throw new Error('[prim] onTriggerEnter must be function or null')
    }
    this._onTriggerEnter = value
  }

  get onTriggerLeave() {
    return this._onTriggerLeave
  }

  set onTriggerLeave(value = defaults.onTriggerLeave) {
    if (value !== null && typeof value !== 'function') {
      throw new Error('[prim] onTriggerLeave must be function or null')
    }
    this._onTriggerLeave = value
  }

  get doubleside() {
    return this._doubleside
  }

  set doubleside(value = defaults.doubleside) {
    if (!isBoolean(value)) {
      throw new Error('[prim] doubleside must be boolean')
    }
    if (this._doubleside === value) return
    this._doubleside = value
    this.needsRebuild = true
    this.setDirty()
  }

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPrimProxy(this, super.getProxy())
    }
    return this.proxy
  }
}
