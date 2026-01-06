import * as THREE from '../../extras/three.js'
import { PhysicsConfig } from '../../config/SystemConfig.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'

const { v1, q1 } = SharedVectorPool('PlayerPhysicsState', 1, 1)
const UP = new THREE.Vector3(0, 1, 0)

export class PlayerPhysicsState {
  constructor(world, player, physics) {
    this.world = world
    this.player = player
    this.physics = physics
  }

  updateJumpFallState(delta) {
    const { physics, player } = this

    if (physics.jumped && !physics.grounded) {
      physics.jumped = false
      physics.jumping = true
    }

    if (!physics.grounded && player.capsule.getLinearVelocity().y < 0) {
      physics.fallTimer += delta
    } else {
      physics.fallTimer = 0
    }

    if (physics.fallTimer > PhysicsConfig.FALL_TIMER_THRESHOLD && !physics.falling) {
      physics.jumping = false
      physics.airJumping = false
      physics.falling = true
      physics.fallStartY = player.base.position.y
    }

    if (physics.falling) {
      physics.fallDistance = physics.fallStartY - player.base.position.y
      if (physics.grounded) {
        physics.falling = false
      }
    }

    if (physics.jumping && physics.grounded) {
      physics.jumping = false
    }

    if (physics.airJumped && physics.grounded) {
      physics.airJumped = false
      physics.airJumping = false
    }
  }

  updateMaterialFriction() {
    const PHYSX = this.world.PHYSX || globalThis.PHYSX
    if (!PHYSX) return

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

  applyMovementForce(snare) {
    if (!this.physics.moving) return

    const PHYSX = this.world.PHYSX || globalThis.PHYSX
    if (!PHYSX) return

    const moveSpeed = (this.player.running ? PhysicsConfig.RUN_SPEED : PhysicsConfig.WALK_SPEED) * this.physics.mass
    const adjustedSpeed = moveSpeed * (1 - snare)

    const slopeRotation = q1.setFromUnitVectors(UP, this.physics.groundNormal)
    const moveForce = v1
      .copy(this.physics.moveDir)
      .multiplyScalar(adjustedSpeed * 10)
      .applyQuaternion(slopeRotation)

    this.player.capsule.addForce(moveForce.toPxVec3(), PHYSX.PxForceModeEnum.eFORCE, true)
  }

  handleJump() {
    const PHYSX = this.world.PHYSX || globalThis.PHYSX
    if (!PHYSX) return

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

  updateBuildModeFlying() {
    if (this.player.jumpPressed && this.world.builder?.enabled) {
      if (this.world.time - this.physics.lastJumpAt < 0.4) {
        this.physics.flying = !this.physics.flying
      }
      this.physics.lastJumpAt = this.world.time
    }
  }
}
