import * as THREE from '../extras/three.js'

import { Node } from './Node.js'
import { getRef, secureRef } from './NodeProxy.js'
import { initializeNode } from './base/NodeConstructorHelper.js'
import { onSetRebuildIf  } from '../utils/helpers/defineProperty.js'
import { createSchemaProxy } from '../utils/helpers/NodeSchemaHelper.js'
import { schema } from '../utils/validation/index.js'

import { Layers } from '../extras/Layers.js'
import { geometryToPxMesh } from '../extras/geometryToPxMesh.js'
import { v, q } from '../utils/TempVectors.js'
import { StructuredLogger } from '../utils/logging/index.js'
import { StateInitializer } from './base/StateInitializer.js'
import { LifecycleHelper } from './base/LifecycleHelper.js'

const logger = new StructuredLogger('Collider')

const rebuildIfShape = onSetRebuildIf(function() { return !!this.shape })

const propertySchema = schema('type', 'width', 'height', 'depth', 'radius', 'convex', 'trigger', 'friction', 'restitution')
  .add('layer', { default: 'environment' })
  .add('staticFriction', { default: 0.6, onSet: rebuildIfShape })
  .add('dynamicFriction', { default: 0.6, onSet: rebuildIfShape })
  .override('type', { onSet() { this.markRebuild() } })
  .override('width', { onSet: onSetRebuildIf(function() { return this.shape && this._type === 'box' }) })
  .override('height', { onSet: onSetRebuildIf(function() { return this.shape && this._type === 'box' }) })
  .override('depth', { onSet: onSetRebuildIf(function() { return this.shape && this._type === 'box' }) })
  .override('radius', { onSet: onSetRebuildIf(function() { return this.shape && this._type === 'sphere' }) })
  .override('convex', { onSet: rebuildIfShape })
  .override('trigger', { onSet: rebuildIfShape })
  .build()

const defaults = {}

export class Collider extends Node {
  constructor(data = {}) {
    super(data)
    initializeNode(this, 'collider', propertySchema, {}, data)
    StateInitializer.mergeState(this, StateInitializer.initPhysicsState())
  }

  mount() {
    let geometry
    let pmesh
    if (this._type === 'box') {
      geometry = new PHYSX.PxBoxGeometry(this._width / 2, this._height / 2, this._depth / 2)
    } else if (this._type === 'sphere') {
      geometry = new PHYSX.PxSphereGeometry(this._radius)
    } else if (this._type === 'geometry') {
      const isConvex = this._trigger || this._convex
      pmesh = geometryToPxMesh(this.ctx.world, this._geometry, isConvex)
      if (!pmesh) return logger.error('Failed to generate collider pmesh', { isConvex })
      this.matrixWorld.decompose(v[0], q[0], v[1])
      const scale = new PHYSX.PxMeshScale(new PHYSX.PxVec3(v[1].x, v[1].y, v[1].z), new PHYSX.PxQuat(0, 0, 0, 1))
      if (isConvex) {
        geometry = new PHYSX.PxConvexMeshGeometry(pmesh.value, scale)
      } else {
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
      logger.error('Failed to create physics shape', { layer: this._layer, error: err.message })
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
    const position = v[0].copy(this.position).multiply(this.parent.scale)
    const pose = new PHYSX.PxTransform()
    position.toPxTransform(pose)
    this.quaternion.toPxTransform(pose)
    this.shape.setLocalPose(pose)
    this.parent?.addShape?.(this.shape)
    PHYSX.destroy(geometry)
    LifecycleHelper.markMounted(this)
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
      return
    }
    if (didMove) {
    }
  }

  unmount() {
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
    this.markRebuild()
    this.setDirty()
  }

  setMaterial(staticFriction, dynamicFriction, restitution) {
    this.staticFriction = staticFriction
    this.dynamicFriction = dynamicFriction
    this.restitution = restitution
  }

  requestRebuild() {
    this.markRebuild()
    this.setDirty()
  }

  getProxy() {
    return createSchemaProxy(this, propertySchema,
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
}
