import * as THREE from '../../extras/three.js'
import { StructuredLogger } from '../../utils/logging/index.js'
import { geometryToPxMesh } from '../../extras/geometryToPxMesh.js'
import { Layers } from '../../extras/Layers.js'
import { getGeometry, isUniformScale } from './PrimGeometry.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'

const logger = new StructuredLogger('PrimPhysics')

const { v1: _v1, v2: _v2, q1: _q1 } = SharedVectorPool('PrimPhysics', 2, 1)

export function mountPhysics(prim) {
  if (!PHYSX) return

  const type = prim._physics
  const mass = prim._mass
  const linearDamping = prim._linearDamping
  const angularDamping = prim._angularDamping
  const trigger = prim._trigger
  const size = prim._geometrySize

  prim.matrixWorldOffset.decompose(_v1, _q1, _v2)
  if (!prim._tm) prim._tm = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
  _v1.toPxTransform(prim._tm)
  _q1.toPxTransform(prim._tm)

  if (type === 'static') {
    prim.actor = prim.ctx.world.physics.physics.createRigidStatic(prim._tm)
  } else if (type === 'kinematic') {
    prim.actor = prim.ctx.world.physics.physics.createRigidDynamic(prim._tm)
    prim.actor.setRigidBodyFlag(PHYSX.PxRigidBodyFlagEnum.eKINEMATIC, true)
    PHYSX.PxRigidBodyExt.prototype.setMassAndUpdateInertia(prim.actor, mass)
  } else if (type === 'dynamic') {
    prim.actor = prim.ctx.world.physics.physics.createRigidDynamic(prim._tm)
    PHYSX.PxRigidBodyExt.prototype.setMassAndUpdateInertia(prim.actor, mass)
    prim.actor.setLinearDamping(linearDamping)
    prim.actor.setAngularDamping(angularDamping)
  }

  let pxGeometry = null
  let pmesh = null

  if (prim._type === 'box') {
    const [width, height, depth] = size
    pxGeometry = new PHYSX.PxBoxGeometry((width / 2) * _v2.x, (height / 2) * _v2.y, (depth / 2) * _v2.z)
  } else if (prim._type === 'sphere' && isUniformScale(_v2)) {
    const [radius] = size
    pxGeometry = new PHYSX.PxSphereGeometry(radius * _v2.x)
  } else {
    const threeGeometry = getGeometry(prim._type, size)
    pmesh = geometryToPxMesh(prim.ctx.world, threeGeometry, true)
    if (pmesh && pmesh.value) {
      const _scaleVec = new PHYSX.PxVec3(_v2.x, _v2.y, _v2.z)
      const _scaleQuat = new PHYSX.PxQuat(0, 0, 0, 1)
      const _scale = new PHYSX.PxMeshScale(_scaleVec, _scaleQuat)
      pxGeometry = new PHYSX.PxConvexMeshGeometry(pmesh.value, _scale)
      PHYSX.destroy(_scale)
      PHYSX.destroy(_scaleVec)
      PHYSX.destroy(_scaleQuat)
      prim.pmesh = pmesh
    } else {
      logger.warn('Failed to create convex mesh, falling back to box', { type: prim._type })
      const boxSize = getColliderSize(prim)
      pxGeometry = new PHYSX.PxBoxGeometry(boxSize[0] / 2, boxSize[1] / 2, boxSize[2] / 2)
    }
  }

  const staticFriction = prim._staticFriction
  const dynamicFriction = prim._dynamicFriction
  const restitution = prim._restitution
  const material = prim.ctx.world.physics.getMaterial(staticFriction, dynamicFriction, restitution)

  const flags = new PHYSX.PxShapeFlags()
  if (trigger) {
    flags.raise(PHYSX.PxShapeFlagEnum.eTRIGGER_SHAPE)
  } else {
    flags.raise(PHYSX.PxShapeFlagEnum.eSCENE_QUERY_SHAPE | PHYSX.PxShapeFlagEnum.eSIMULATION_SHAPE)
  }

  prim.shape = prim.ctx.world.physics.physics.createShape(pxGeometry, material, true, flags)

  const layerName = prim._layer
  const layer = Layers[layerName]
  let pairFlags = PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_FOUND | PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_LOST
  if (!trigger) {
    pairFlags |= PHYSX.PxPairFlagEnum.eNOTIFY_CONTACT_POINTS
  }
  const filterData = new PHYSX.PxFilterData(layer.group, layer.mask, pairFlags, 0)
  prim.shape.setQueryFilterData(filterData)
  prim.shape.setSimulationFilterData(filterData)

  prim.actor.attachShape(prim.shape)
  prim.shapes.add(prim.shape)

  const self = prim
  const playerId = prim.ctx.entity?.isPlayer ? prim.ctx.entity.data.id : null
  prim.actorHandle = prim.ctx.world.physics.addActor(prim.actor, {
    onInterpolate: type === 'kinematic' || type === 'dynamic' ? prim.onInterpolate : null,
    node: prim,
    get tag() {
      return self._tag
    },
    get playerId() {
      return playerId
    },
    get onContactStart() {
      return self._onContactStart
    },
    get onContactEnd() {
      return self._onContactEnd
    },
    get onTriggerEnter() {
      return self._onTriggerEnter
    },
    get onTriggerLeave() {
      return self._onTriggerLeave
    },
  })

  PHYSX.destroy(pxGeometry)
}

export function unmountPhysics(prim) {
  if (prim.actor) {
    prim.actorHandle?.destroy()
    prim.actorHandle = null
    prim.shapes.clear()
    prim.shape?.release()
    prim.shape = null
    prim.actor.release()
    prim.actor = null
  }
  if (prim._tm) {
    PHYSX.destroy(prim._tm)
    prim._tm = null
  }
  if (prim.pmesh) {
    prim.pmesh.release()
    prim.pmesh = null
  }
}

export function getColliderSize(prim) {
  switch (prim._type) {
    case 'cylinder':
      return [prim.scale.x * 2, prim.scale.y, prim.scale.z * 2]
    case 'cone':
      return [prim.scale.x * 2, prim.scale.y, prim.scale.z * 2]
    case 'torus':
      const diameter = (prim.scale.x + prim.scale.x * 0.3) * 2
      return [diameter, prim.scale.x * 0.3 * 2, diameter]
    default:
      return [prim.scale.x, prim.scale.y, prim.scale.z]
  }
}
