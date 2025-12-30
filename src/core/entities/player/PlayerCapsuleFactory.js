import * as THREE from '../../extras/three.js'
import { Layers } from '../../extras/Layers.js'
import { PhysicsConfig } from '../../config/SystemConfig.js'
import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'

const logger = new ComponentLogger('PlayerCapsuleFactory')
const BACKWARD = new THREE.Vector3(0, 0, 1)
const { q1, v1 } = SharedVectorPool('PlayerCapsuleFactory', 1, 1)

export class PlayerCapsuleFactory {
  constructor(world) {
    this.world = world
    this.physics = world.physics
  }

  createCapsule(player) {
    const PHYSX = this.world.PHYSX || globalThis.PHYSX
    if (!PHYSX) {
      logger.warn('PHYSX not available - world.PHYSX and globalThis.PHYSX both undefined', {})
      return { capsule: null, capsuleHandle: null, material: null }
    }
    const radius = player.capsuleRadius
    const height = player.capsuleHeight
    const halfHeight = (height - radius - radius) / 2
    const geometry = new PHYSX.PxCapsuleGeometry(radius, halfHeight)
    const material = this.physics.physics.createMaterial(0, 0, 0)
    const flags = new PHYSX.PxShapeFlags(
      PHYSX.PxShapeFlagEnum.eSCENE_QUERY_SHAPE | PHYSX.PxShapeFlagEnum.eSIMULATION_SHAPE
    )
    const shape = this.physics.physics.createShape(geometry, material, true, flags)
    const localPose = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    q1.set(0, 0, 0).setFromAxisAngle(BACKWARD, Math.PI / 2)
    q1.toPxTransform(localPose)
    v1.set(0, halfHeight + radius, 0)
    v1.toPxTransform(localPose)
    shape.setLocalPose(localPose)
    const filterData = new PHYSX.PxFilterData(
      Layers.player.group,
      Layers.player.mask,
      PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_FOUND |
        PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_LOST |
        PHYSX.PxPairFlagEnum.eNOTIFY_CONTACT_POINTS |
        PHYSX.PxPairFlagEnum.eDETECT_CCD_CONTACT |
        PHYSX.PxPairFlagEnum.eSOLVE_CONTACT |
        PHYSX.PxPairFlagEnum.eDETECT_DISCRETE_CONTACT,
      0
    )
    shape.setContactOffset(0.08)
    shape.setQueryFilterData(filterData)
    shape.setSimulationFilterData(filterData)
    const transform = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    v1.copy(player.base.position).toPxTransform(transform)
    q1.set(0, 0, 0, 1).toPxTransform(transform)
    const capsule = this.physics.physics.createRigidDynamic(transform)
    capsule.setMass(player.mass)
    capsule.setRigidBodyFlag(PHYSX.PxRigidBodyFlagEnum.eENABLE_CCD, true)
    capsule.setRigidDynamicLockFlag(PHYSX.PxRigidDynamicLockFlagEnum.eLOCK_ANGULAR_X, true)
    capsule.setRigidDynamicLockFlag(PHYSX.PxRigidDynamicLockFlagEnum.eLOCK_ANGULAR_Z, true)
    capsule.setActorFlag(PHYSX.PxActorFlagEnum.eDISABLE_GRAVITY, true)
    capsule.attachShape(shape)
    const capsuleHandle = this.physics.addActor(capsule, {
      tag: null,
      playerId: player.data.id,
      onInterpolate: position => {
        player.base.position.copy(position)
      },
    })
    const groundSweepRadius = PhysicsConfig.CAPSULE_RADIUS
    const groundSweepGeometry = new PHYSX.PxSphereGeometry(groundSweepRadius)
    player.groundSweepGeometry = groundSweepGeometry
    return { capsule, capsuleHandle, material }
  }
}
