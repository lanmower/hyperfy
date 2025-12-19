import * as THREE from '../../extras/three.js'
import { PhysicsConfig } from '../../config/SystemConfig.js'
import { VelocityCalculator } from './VelocityCalculator.js'

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
    VelocityCalculator.updateGravityAndVelocity(this.world, this.player, this.physics, delta, snare)
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
    VelocityCalculator.updateFlyingPhysics(this.world, this.player, this.physics, delta)
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
