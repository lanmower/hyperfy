import * as THREE from '../extras/three.js'

import { getRef, Node, secureRef } from './Node.js'
import { defineProps, onSetRebuildIf, createPropertyProxy } from '../utils/defineProperty.js'
import { schema } from '../utils/createNodeSchema.js'

import { Layers } from '../extras/Layers.js'
import { geometryToPxMesh } from '../extras/geometryToPxMesh.js'
import { v, q } from '../utils/TempVectors.js'

const rebuildIfShape = onSetRebuildIf(function() { return !!this.shape })

const propertySchema = schema('type', 'width', 'height', 'depth', 'radius', 'convex', 'trigger', 'friction', 'restitution')
  .add('layer', { default: 'environment' })
  .add('staticFriction', { default: 0.6, onSet: rebuildIfShape })
  .add('dynamicFriction', { default: 0.6, onSet: rebuildIfShape })
  .override('type', { onSet() { this.needsRebuild = true } })
  .override('width', { onSet: onSetRebuildIf(function() { return this.shape && this._type === 'box' }) })
  .override('height', { onSet: onSetRebuildIf(function() { return this.shape && this._type === 'box' }) })
  .override('depth', { onSet: onSetRebuildIf(function() { return this.shape && this._type === 'box' }) })
  .override('radius', { onSet: onSetRebuildIf(function() { return this.shape && this._type === 'sphere' }) })
  .override('convex', { onSet: rebuildIfShape })
  .override('trigger', { onSet: rebuildIfShape })
  .build()

export class Collider extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'collider'
    defineProps(this, propertySchema, defaults, data)
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
    this.copyProperties(source, propertySchema)
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
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy(),
        {
          setSize: this.setSize,
          setMaterial: this.setMaterial,
          requestRebuild: this.requestRebuild,
        },
        {
          geometry: { get: function() { return this.geometry }, set: function(v) { this.geometry = v } },
          layer: { get: function() { return this.layer }, set: function(v) { if (v === 'player') throw new Error('[collider] layer invalid: player'); this.layer = v } },
        }
      )
    }
    return this.proxy
  }
}
