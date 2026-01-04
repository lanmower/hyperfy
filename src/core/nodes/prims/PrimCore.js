import * as THREE from '../../extras/three.js'
import * as pc from '../../extras/playcanvas.js'
import { StructuredLogger } from '../../utils/logging/index.js'
import { Node } from '../Node.js'
import { defaults } from './PrimDefaults.js'
import { getGeometry, getGeometryConfig } from './PrimGeometry.js'
import { getMaterial, applyTexture, quantizeOpacity } from './PrimMaterial.js'
import { mountPhysics, unmountPhysics } from './PrimPhysics.js'
import { createPrimProxy } from './PrimProxy.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'

const logger = new StructuredLogger('Prim')

const { v1: _v1, v2: _v2, q1: _q1, m1: _m1, m2: _m2, m3: _m3 } = SharedVectorPool('Prim', 2, 1, 0, 3)
const _defaultScale = new THREE.Vector3(1, 1, 1)
const _pcDefaultScale = new pc.Vec3(1, 1, 1)

let count = 0

if (typeof window !== 'undefined') {
  window.prims = {
    get count() {
      return count
    },
  }
}

export class PrimCore extends Node {
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

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPrimProxy(this, super.getProxy())
    }
    return this.proxy
  }
}
