import * as THREE from '../../extras/three.js'
import { PlayerPlatformTracker } from './PlayerPlatformTracker.js'
import { PlayerPhysicsState } from './PlayerPhysicsState.js'
import { PlayerPhysicsCalculations } from './PlayerPhysicsCalculations.js'
import { PlayerPhysicsGroundDetection } from './PlayerPhysicsGroundDetection.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'

const { v1 } = SharedVectorPool('PlayerPhysics', 1, 0)

export class PlayerPhysics {
  constructor(world, player) {
    this.world = world
    this.player = player

    this.jumped = false
    this.jumping = false
    this.falling = false
    this.fallTimer = 0
    this.fallDistance = 0
    this.fallStartY = 0
    this.airJumped = false
    this.airJumping = false

    this.moveDir = new THREE.Vector3()
    this.flyDir = new THREE.Vector3()
    this.moving = false
    this.groundNormal = new THREE.Vector3(0, 1, 0)

    this.platform = {
      actor: null,
      prevTransform: new THREE.Matrix4(),
    }

    this.lastJumpAt = 0
    this.materialMax = null

    this.calculations = new PlayerPhysicsCalculations(player.mass)
    this.groundDetection = new PlayerPhysicsGroundDetection(world, player)
    this.platformTracker = new PlayerPlatformTracker(world, player, this.platform)
    this.physicsState = new PlayerPhysicsState(world, player, this)
  }

  update(delta) {
    const freeze = this.player.data.effect?.freeze
    const anchor = this.player.getAnchorMatrix()
    const snare = this.player.data.effect?.snare || 0

    this.updateAnchorState(anchor)

    if (anchor) {
      return
    }

    if (!this.calculations.flying) {
      this.updateStandardPhysics(delta, snare)
    } else {
      this.updateFlyingPhysics(delta)
    }

    this.updateBuildModeFlying()

    this.player.jumpPressed = false
  }

  updateAnchorState(anchor) {
    const PHYSX = this.world.PHYSX || globalThis.PHYSX
    if (!PHYSX) return

    const DISABLE_SIMULATION = PHYSX.PxActorFlagEnum.eDISABLE_SIMULATION

    if (anchor && !this.player.capsuleDisabled) {
      this.player.capsule.setActorFlag(DISABLE_SIMULATION, true)
      this.player.capsuleDisabled = true
    } else if (!anchor && this.player.capsuleDisabled) {
      this.player.capsule.setActorFlag(DISABLE_SIMULATION, false)
      this.player.capsuleDisabled = false
    }
  }

  updateStandardPhysics(delta, snare) {
    this.groundDetection.update(this.groundDetection.grounded)
    this.platformTracker.update(this.groundDetection.grounded)

    if (this.groundDetection.shouldCheckGround(this.jumping, this.falling)) {
      this.groundDetection.detectGround()
      this.groundDetection.handleSteepSlopes()
    }

    // Sync ground normal from ground detection
    this.groundNormal.copy(this.groundDetection.groundNormal)

    this.physicsState.updateMaterialFriction()
    this.physicsState.updateJumpFallState(delta)
    this.updateGravityAndVelocity(delta, snare)
    this.physicsState.applyMovementForce(snare)
    this.physicsState.handleJump()
  }

  updateGravityAndVelocity(delta, snare) {
    const PHYSX = this.world.PHYSX || globalThis.PHYSX
    if (!PHYSX) return

    const groundState = this.groundDetection.getGroundState()
    this.calculations.applyGravity(
      groundState.grounded,
      this.platform,
      this.player.capsule,
      PHYSX
    )

    const velocity = v1.copy(this.player.capsule.getLinearVelocity())

    this.calculations.applyDrag(
      velocity,
      delta,
      groundState.groundNormal,
      groundState.grounded,
      this.jumping
    )

    this.calculations.applyFallVelocity(velocity, groundState.justLeftGround, this.jumping)
    this.calculations.applySlippingGravity(velocity, groundState.slipping)
    this.calculations.applyPushForce(velocity, delta)

    this.player.capsule.setLinearVelocity(velocity.toPxVec3())
  }

  updateFlyingPhysics(delta) {
    const PHYSX = this.world.PHYSX || globalThis.PHYSX
    if (!PHYSX) return

    if (this.moving || this.player.jumpDown || this.player.control?.keyC?.down) {
      const force = this.calculations.calculateFlyingForce(
        this.moving,
        this.player.jumpDown,
        this.player.control?.keyC?.down,
        this.player.running
      )
      this.player.capsule.addForce(force.toPxVec3(), PHYSX.PxForceModeEnum.eFORCE, true)
    }

    const velocity = v1.copy(this.player.capsule.getLinearVelocity())
    this.calculations.applyFlyingDrag(velocity, delta, this.player.capsule, PHYSX)
    this.calculations.stopAngularRotation(this.player.capsule, PHYSX)

    if (!this.world.builder?.enabled) {
      this.calculations.flying = false
    }
  }

  updateBuildModeFlying() {
    this.physicsState.updateBuildModeFlying()
  }

  push(force) {
    this.calculations.push(force)
  }

  getState() {
    return {
      grounded: this.groundDetection.grounded,
      falling: this.falling,
      jumping: this.jumping,
      fallDistance: this.fallDistance,
    }
  }
}
