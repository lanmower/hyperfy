import { collisionLayers as layers } from '../utils/NodeConstants.js'
import * as THREE from '../extras/three.js'

import { getRef, Node, secureRef } from './Node.js'
import { defineProps, validators } from '../utils/defineProperty.js'

import { Layers } from '../extras/Layers.js'
import { geometryToPxMesh } from '../extras/geometryToPxMesh.js'
import { v, q } from '../utils/TempVectors.js'

const defaults = {
  type: 'box',
  width: 1,
  height: 1,
  depth: 1,
  radius: 0.5,
  geometry: null,
  convex: false,
  trigger: false,
  layer: 'environment',
  staticFriction: 0.6,
  dynamicFriction: 0.6,
  restitution: 0,
}

const propertySchema = {
  type: {
    default: defaults.type,
    validate: (value) => !types.includes(value) ? `invalid type: ${value}` : null,
    onSet() { this.needsRebuild = true; this.setDirty() },
  },
  width: {
    default: defaults.width,
    validate: validators.number,
    onSet() { if (this.shape && this._type === 'box') { this.needsRebuild = true; this.setDirty() } },
  },
  height: {
    default: defaults.height,
    validate: validators.number,
    onSet() { if (this.shape && this._type === 'box') { this.needsRebuild = true; this.setDirty() } },
  },
  depth: {
    default: defaults.depth,
    validate: validators.number,
    onSet() { if (this.shape && this._type === 'box') { this.needsRebuild = true; this.setDirty() } },
  },
  radius: {
    default: defaults.radius,
    validate: validators.number,
    onSet() { if (this.shape && this._type === 'sphere') { this.needsRebuild = true; this.setDirty() } },
  },
  convex: {
    default: defaults.convex,
    validate: validators.boolean,
    onSet() { if (this.shape) { this.needsRebuild = true; this.setDirty() } },
  },
  trigger: {
    default: defaults.trigger,
    validate: validators.boolean,
    onSet() { if (this.shape) { this.needsRebuild = true; this.setDirty() } },
  },
  layer: {
    default: defaults.layer,
    validate: (value) => !layers.includes(value) ? `invalid layer: ${value}` : null,
    onSet() { if (this.shape) { this.needsRebuild = true; this.setDirty() } },
  },
  staticFriction: {
    default: defaults.staticFriction,
    validate: validators.number,
    onSet() { if (this.shape) { this.needsRebuild = true; this.setDirty() } },
  },
  dynamicFriction: {
    default: defaults.dynamicFriction,
    validate: validators.number,
    onSet() { if (this.shape) { this.needsRebuild = true; this.setDirty() } },
  },
  restitution: {
    default: defaults.restitution,
    validate: validators.number,
    onSet() { if (this.shape) { this.needsRebuild = true; this.setDirty() } },
  },
}

const types = ['box', 'sphere', 'geometry']

export class Collider extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'collider'
    defineProps(this, propertySchema, defaults)

    this.type = data.type
    this.width = data.width
    this.height = data.height
    this.depth = data.depth
    this.radius = data.radius
    this.geometry = data.geometry
    this.convex = data.convex
    this.trigger = data.trigger
    this.layer = data.layer
    this.staticFriction = data.staticFriction
    this.dynamicFriction = data.dynamicFriction
    this.restitution = data.restitution
  }

  mount() {
    let geometry
    let pmesh
    if (this._type === 'box') {
      geometry = new PHYSX.PxBoxGeometry(this._width / 2, this._height / 2, this._depth / 2)
    } else if (this._type === 'sphere') {
      geometry = new PHYSX.PxSphereGeometry(this._radius)
    } else if (this._type === 'geometry') {
      // note: triggers MUST be convex according to PhysX/Unity
      const isConvex = this._trigger || this._convex
      pmesh = geometryToPxMesh(this.ctx.world, this._geometry, isConvex)
      if (!pmesh) return console.error('failed to generate collider pmesh')
      this.matrixWorld.decompose(v[0], q[0], v[1])
      const scale = new PHYSX.PxMeshScale(new PHYSX.PxVec3(v[1].x, v[1].y, v[1].z), new PHYSX.PxQuat(0, 0, 0, 1))
      if (isConvex) {
        geometry = new PHYSX.PxConvexMeshGeometry(pmesh.value, scale)
      } else {
        // const flags = new PHYSX.PxMeshGeometryFlags()
        // flags.raise(PHYSX.PxMeshGeometryFlagEnum.eDOUBLE_SIDED)
        geometry = new PHYSX.PxTriangleMeshGeometry(pmesh.value, scale)
      }
      PHYSX.destroy(scale)
    }
    const material = this.ctx.world.physics.getMaterial(this._staticFriction, this._dynamicFriction, this._restitution)
    const flags = new PHYSX.PxShapeFlags()
    if (this._trigger) {
      flags.raise(PHYSX.PxShapeFlagEnum.eTRIGGER_SHAPE)
    } else {
      flags.raise(PHYSX.PxShapeFlagEnum.eSCENE_QUERY_SHAPE | PHYSX.PxShapeFlagEnum.eSIMULATION_SHAPE)
    }
    const layer = Layers[this._layer]
    let pairFlags = PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_FOUND | PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_LOST
    if (!this._trigger) {
      pairFlags |= PHYSX.PxPairFlagEnum.eNOTIFY_CONTACT_POINTS
    }
    this.pmesh = pmesh
    const filterData = new PHYSX.PxFilterData(layer.group, layer.mask, pairFlags, 0)
    try {
      this.shape = this.ctx.world.physics.physics.createShape(geometry, material, true, flags)
    } catch (err) {
      console.error('[collider] failed to create shape')
      console.error(err)
      // cleanup
      if (geometry) {
        PHYSX.destroy(geometry)
      }
      if (this.pmesh) {
        this.pmesh.release()
        this.pmesh = null
      }
      return
    }
    this.shape.setQueryFilterData(filterData)
    this.shape.setSimulationFilterData(filterData)
    // const parentWorldScale = v[1]
    // this.parent.matrixWorld.decompose(v[0], q[0], parentWorldScale)
    const position = v[0].copy(this.position).multiply(this.parent.scale)
    const pose = new PHYSX.PxTransform()
    position.toPxTransform(pose)
    this.quaternion.toPxTransform(pose)
    this.shape.setLocalPose(pose)
    this.parent?.addShape?.(this.shape)
    // console.log('geometry', geometry)
    // this._geometry = geometry
    PHYSX.destroy(geometry)
    this.needsRebuild = false
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
      return
    }
    if (didMove) {
      // ...
    }
  }

  unmount() {
    // if (this.type === 'geometry' && pxMeshes[this.geometry.uuid]) {
    //   pxMeshes[this.geometry.uuid].release()
    //   delete pxMeshes[this.geometry.uuid]
    // }
    this.parent?.removeShape?.(this.shape)
    this.shape?.release()
    this.shape = null
    this.pmesh?.release()
    this.pmesh = null
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    for (const key in propertySchema) {
      this[`_${key}`] = source[`_${key}`]
    }
    this._geometry = source._geometry
    return this
  }

  get geometry() {
    return secureRef({}, () => this._geometry)
  }

  set geometry(value = defaults.geometry) {
    this._geometry = getRef(value)
    this.needsRebuild = true
    this.setDirty()
  }

  setMaterial(staticFriction, dynamicFriction, restitution) {
    this.staticFriction = staticFriction
    this.dynamicFriction = dynamicFriction
    this.restitution = restitution
  }

  requestRebuild() {
    this.needsRebuild = true
    this.setDirty()
  }

  getProxy() {
    if (!this.proxy) {
      const self = this
      let proxy = {
        get type() {
          return self.type
        },
        set type(value) {
          self.type = value
        },
        get width() {
          return self.width
        },
        set width(value) {
          self.width = value
        },
        get height() {
          return self.height
        },
        set height(value) {
          self.height = value
        },
        get depth() {
          return self.depth
        },
        set depth(value) {
          self.depth = value
        },
        setSize(width, height, depth) {
          self.setSize(width, height, depth)
        },
        get radius() {
          return self.radius
        },
        set radius(value) {
          self.radius = value
        },
        get geometry() {
          return self.geometry
        },
        set geometry(value) {
          self.geometry = value
        },
        get convex() {
          return self.convex
        },
        set convex(value) {
          self.convex = value
        },
        get trigger() {
          return self.trigger
        },
        set trigger(value) {
          self.trigger = value
        },
        get layer() {
          return self.layer
        },
        set layer(value) {
          if (value === 'player') {
            throw new Error('[collider] layer invalid: player')
          }
          self.layer = value
        },
        get staticFriction() {
          return self.staticFriction
        },
        set staticFriction(value) {
          self.staticFriction = value
        },
        get dynamicFriction() {
          return self.dynamicFriction
        },
        set dynamicFriction(value) {
          self.dynamicFriction = value
        },
        get restitution() {
          return self.restitution
        },
        set restitution(value) {
          self.restitution = value
        },
        setMaterial(staticFriction, dynamicFriction, restitution) {
          self.setMaterial(staticFriction, dynamicFriction, restitution)
        },
        requestRebuild() {
          self.requestRebuild()
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
    }
    return this.proxy
  }
}
