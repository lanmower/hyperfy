import { PhysicsConfig } from '../../config/SystemConfig.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'

const { v1, v2, v3, v4 } = SharedVectorPool('PlayerPhysicsCalculations', 4, 0)

export class PlayerPhysicsCalculations {
  constructor(mass) {
    this.mass = mass
    this.gravity = PhysicsConfig.GRAVITY
    this.jumpHeight = PhysicsConfig.JUMP_HEIGHT
    this.effectiveGravity = this.mass * this.gravity
    this.pushForce = null
    this.pushForceInit = false
    this.flying = false
    this.flyForce = PhysicsConfig.FLY_FORCE_MULTIPLIER
    this.flyDrag = PhysicsConfig.FLY_DRAG
    this.flyDir = { x: 0, y: 0, z: 0 }
  }

  applyGravity(grounded, platform, capsule, PHYSX) {
    if (!PHYSX) return

    if (grounded && platform.actor) {
      const isStatic = platform.actor instanceof PHYSX.PxRigidStatic
      const isKinematic = platform.actor
        .getRigidBodyFlags?.()
        .isSet(PHYSX.PxRigidBodyFlagEnum.eKINEMATIC)

      if (!isKinematic && !isStatic) {
        const amount = -PhysicsConfig.GRAVITY * PhysicsConfig.GRAVITY_PLATFORM_FACTOR
        const force = v1.set(0, amount, 0)
        PHYSX.PxRigidBodyExt.prototype.addForceAtPos(
          platform.actor,
          force.toPxVec3(),
          capsule.getGlobalPose().p,
          PHYSX.PxForceModeEnum.eFORCE,
          true
        )
      }
    } else {
      const force = v1.set(0, -this.effectiveGravity, 0)
      capsule.addForce(force.toPxVec3(), PHYSX.PxForceModeEnum.eFORCE, true)
    }
  }

  applyDrag(velocity, delta, groundNormal, grounded, jumping) {
    const dragCoeff = PhysicsConfig.DRAG_COEFFICIENT * delta
    const perpComponent = v2.copy(groundNormal).multiplyScalar(velocity.dot(groundNormal))
    const parallelComponent = v3.copy(velocity).sub(perpComponent)
    parallelComponent.multiplyScalar(1 - dragCoeff)
    velocity.copy(parallelComponent.add(perpComponent))

    if (grounded && !jumping) {
      const projectedLength = velocity.dot(groundNormal)
      const projectedVector = v2.copy(groundNormal).multiplyScalar(projectedLength)
      velocity.sub(projectedVector)
    }
  }

  applyFallVelocity(velocity, justLeftGround, jumping) {
    if (justLeftGround && !jumping) {
      velocity.y = PhysicsConfig.FALL_VELOCITY
    }
  }

  applySlippingGravity(velocity, slipping) {
    if (slipping) {
      velocity.y -= PhysicsConfig.SLIPPING_GRAVITY
    }
  }

  applyPushForce(velocity, delta) {
    if (!this.pushForce) return

    if (!this.pushForceInit) {
      this.pushForceInit = true
    }

    velocity.add(this.pushForce)

    const drag = PhysicsConfig.PUSH_DRAG
    const decayFactor = 1 - drag * delta
    if (decayFactor < 0) {
      this.pushForce.set(0, 0, 0)
    } else {
      this.pushForce.multiplyScalar(Math.max(decayFactor, 0))
    }

    if (this.pushForce.length() < 0.01) {
      this.pushForce = null
    }
  }

  calculateFlyingForce(moving, jumpDown, keyC, running) {
    const flySpeed = this.flyForce * (running ? 2 : 1)
    const force = v1.copy(this.flyDir).multiplyScalar(flySpeed)

    if (jumpDown) {
      force.y = flySpeed
    } else if (keyC) {
      force.y = -flySpeed
    }

    return force
  }

  applyFlyingDrag(velocity, delta, capsule, PHYSX) {
    if (!PHYSX) return

    const dragForce = v3.copy(velocity).multiplyScalar(-this.flyDrag * delta)
    capsule.addForce(dragForce.toPxVec3(), PHYSX.PxForceModeEnum.eFORCE, true)
  }

  stopAngularRotation(capsule, PHYSX) {
    if (!PHYSX) return
    const zeroAngular = v4.set(0, 0, 0)
    capsule.setAngularVelocity(zeroAngular.toPxVec3())
  }

  push(force) {
    const v1 = new THREE.Vector3()
    this.pushForce = v1.copy(force)
    this.pushForceInit = false
  }
}
