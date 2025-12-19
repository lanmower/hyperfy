import * as THREE from '../../extras/three.js'
import { PhysicsConfig } from '../../config/SystemConfig.js'

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const v3 = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)

export class PlayerPhysicsState {
  constructor(world, player, physics) {
    this.world = world
    this.player = player
    this.physics = physics
  }

  updateJumpFallState(delta) {
    if (this.physics.jumped && !this.physics.grounded) {
      this.physics.jumped = false
      this.physics.jumping = true
    }

    if (!this.physics.grounded && this.player.capsule.getLinearVelocity().y < 0) {
      this.physics.fallTimer += delta
    } else {
      this.physics.fallTimer = 0
    }

    if (this.physics.fallTimer > 0.1 && !this.physics.falling) {
      this.physics.jumping = false
      this.physics.airJumping = false
      this.physics.falling = true
      this.physics.fallStartY = this.player.base.position.y
    }

    if (this.physics.falling) {
      this.physics.fallDistance = this.physics.fallStartY - this.player.base.position.y
    }

    if (this.physics.falling && this.physics.grounded) {
      this.physics.falling = false
    }

    if (this.physics.jumping && this.physics.grounded) {
      this.physics.jumping = false
    }

    if (this.physics.airJumped && this.physics.grounded) {
      this.physics.airJumped = false
      this.physics.airJumping = false
    }
  }

  updateMaterialFriction() {
    const PHYSX = this.world.PHYSX
    const eMAX = PHYSX.PxCombineModeEnum.eMAX
    const eMIN = PHYSX.PxCombineModeEnum.eMIN

    if (this.physics.grounded) {
      if (this.physics.materialMax !== true) {
        this.player.material.setFrictionCombineMode(eMAX)
        this.player.material.setRestitutionCombineMode(eMAX)
        this.physics.materialMax = true
      }
    } else {
      if (this.physics.materialMax !== false) {
        this.player.material.setFrictionCombineMode(eMIN)
        this.player.material.setRestitutionCombineMode(eMIN)
        this.physics.materialMax = false
      }
    }
  }

  updateGravityAndVelocity(delta, snare) {
    const PHYSX = this.world.PHYSX

    if (this.physics.grounded) {
      if (this.physics.platform.actor) {
        const isStatic = this.physics.platform.actor instanceof PHYSX.PxRigidStatic
        const isKinematic = this.physics.platform.actor
          .getRigidBodyFlags?.()
          .isSet(PHYSX.PxRigidBodyFlagEnum.eKINEMATIC)

        if (!isKinematic && !isStatic) {
          const amount = -9.81 * 0.2
          const force = v1.set(0, amount, 0)
          PHYSX.PxRigidBodyExt.prototype.addForceAtPos(
            this.physics.platform.actor,
            force.toPxVec3(),
            this.player.capsule.getGlobalPose().p,
            PHYSX.PxForceModeEnum.eFORCE,
            true
          )
        }
      }
    } else {
      const force = v1.set(0, -this.physics.effectiveGravity, 0)
      this.player.capsule.addForce(force.toPxVec3(), PHYSX.PxForceModeEnum.eFORCE, true)
    }

    const velocity = v1.copy(this.player.capsule.getLinearVelocity())

    const dragCoeff = 10 * delta
    const perpComponent = v2.copy(this.physics.groundNormal).multiplyScalar(velocity.dot(this.physics.groundNormal))
    const parallelComponent = v3.copy(velocity).sub(perpComponent)
    parallelComponent.multiplyScalar(1 - dragCoeff)
    velocity.copy(parallelComponent.add(perpComponent))

    if (this.physics.grounded && !this.physics.jumping) {
      const projectedLength = velocity.dot(this.physics.groundNormal)
      const projectedVector = v2.copy(this.physics.groundNormal).multiplyScalar(projectedLength)
      velocity.sub(projectedVector)
    }

    if (this.physics.justLeftGround && !this.physics.jumping) {
      velocity.y = -5
    }

    if (this.physics.slipping) {
      velocity.y -= 0.5
    }

    if (this.physics.pushForce) {
      if (!this.physics.pushForceInit) {
        this.physics.pushForceInit = true
        if (this.physics.pushForce.y) {
          this.physics.jumped = true
          this.physics.jumping = false
          this.physics.falling = false
          this.physics.airJumped = false
          this.physics.airJumping = false
        }
      }
      velocity.add(this.physics.pushForce)

      const drag = 20
      const decayFactor = 1 - drag * delta
      if (decayFactor < 0) {
        this.physics.pushForce.set(0, 0, 0)
      } else {
        this.physics.pushForce.multiplyScalar(Math.max(decayFactor, 0))
      }

      if (this.physics.pushForce.length() < 0.01) {
        this.physics.pushForce = null
      }
    }

    this.player.capsule.setLinearVelocity(velocity.toPxVec3())
  }

  applyMovementForce(snare) {
    if (!this.physics.moving) return

    const moveSpeed = (this.player.running ? 6 : 3) * this.physics.mass
    const adjustedSpeed = moveSpeed * (1 - snare)

    const q1 = new THREE.Quaternion()
    const slopeRotation = q1.setFromUnitVectors(UP, this.physics.groundNormal)
    const moveForce = v1
      .copy(this.physics.moveDir)
      .multiplyScalar(adjustedSpeed * 10)
      .applyQuaternion(slopeRotation)

    this.player.capsule.addForce(moveForce.toPxVec3(), this.world.PHYSX.PxForceModeEnum.eFORCE, true)
  }

  handleJump() {
    const PHYSX = this.world.PHYSX

    const shouldJump =
      this.physics.grounded &&
      !this.physics.jumping &&
      this.player.jumpDown &&
      !this.player.data.effect?.snare &&
      !this.player.data.effect?.freeze

    const shouldAirJump =
      false && !this.physics.grounded && !this.physics.airJumped && this.player.jumpPressed && !this.world.builder?.enabled

    if (shouldJump || shouldAirJump) {
      let jumpVelocity = Math.sqrt(2 * this.physics.effectiveGravity * this.physics.jumpHeight)
      jumpVelocity = jumpVelocity * (1 / Math.sqrt(this.physics.mass))

      const velocity = this.player.capsule.getLinearVelocity()
      velocity.y = jumpVelocity
      this.player.capsule.setLinearVelocity(velocity)

      if (shouldJump) {
        this.physics.jumped = true
      }

      if (shouldAirJump) {
        this.physics.falling = false
        this.physics.fallTimer = 0
        this.physics.jumping = true
        this.physics.airJumped = true
        this.physics.airJumping = true
      }
    }
  }

  updateFlyingPhysics(delta) {
    const PHYSX = this.world.PHYSX

    if (this.physics.moving || this.player.jumpDown || this.player.control?.keyC?.down) {
      const flySpeed = this.physics.flyForce * (this.player.running ? 2 : 1)
      const force = v1.copy(this.physics.flyDir).multiplyScalar(flySpeed)

      if (this.player.jumpDown) {
        force.y = flySpeed
      } else if (this.player.control?.keyC?.down) {
        force.y = -flySpeed
      }

      this.player.capsule.addForce(force.toPxVec3(), PHYSX.PxForceModeEnum.eFORCE, true)
    }

    const v2 = new THREE.Vector3()
    const v3 = new THREE.Vector3()
    const v4 = new THREE.Vector3()

    const velocity = v2.copy(this.player.capsule.getLinearVelocity())
    const dragForce = v3.copy(velocity).multiplyScalar(-this.physics.flyDrag * delta)
    this.player.capsule.addForce(dragForce.toPxVec3(), PHYSX.PxForceModeEnum.eFORCE, true)

    const zeroAngular = v4.set(0, 0, 0)
    this.player.capsule.setAngularVelocity(zeroAngular.toPxVec3())

    if (!this.world.builder?.enabled) {
      this.physics.flying = false
    }
  }

  updateBuildModeFlying() {
    if (this.player.jumpPressed && this.world.builder?.enabled) {
      if (this.world.time - this.physics.lastJumpAt < 0.4) {
        this.physics.flying = !this.physics.flying
      }
      this.physics.lastJumpAt = this.world.time
    }
  }
}
