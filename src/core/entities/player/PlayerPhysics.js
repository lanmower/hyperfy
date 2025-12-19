
import * as THREE from '../../extras/three.js'
import { PhysicsConfig } from '../../config/SystemConfig.js'
import { PlayerPlatformTracker } from './PlayerPlatformTracker.js'
import { PlayerGroundDetector } from './PlayerGroundDetector.js'
import { PlayerPhysicsState } from './PlayerPhysicsState.js'

export class PlayerPhysics {
  constructor(world, player) {
    this.world = world
    this.player = player

    this.mass = player.mass
    this.gravity = PhysicsConfig.GRAVITY
    this.jumpHeight = PhysicsConfig.JUMP_HEIGHT
    this.effectiveGravity = this.mass * this.gravity

    this.grounded = false
    this.groundAngle = 0
    this.groundNormal = new THREE.Vector3(0, 1, 0)
    this.groundSweepRadius = PhysicsConfig.GROUND_DETECTION_RADIUS

    this.jumped = false
    this.jumping = false
    this.justLeftGround = false
    this.falling = false
    this.fallTimer = 0
    this.fallDistance = 0
    this.fallStartY = 0
    this.airJumped = false
    this.airJumping = false

    this.moveDir = new THREE.Vector3()
    this.moving = false

    this.platform = {
      actor: null,
      prevTransform: new THREE.Matrix4(),
    }

    this.slipping = false

    this.pushForce = null
    this.pushForceInit = false

    this.flying = false
    this.flyForce = PhysicsConfig.FLY_FORCE_MULTIPLIER
    this.flyDrag = PhysicsConfig.FLY_DRAG
    this.flyDir = new THREE.Vector3()

    this.materialMax = null

    this.lastJumpAt = 0

    this.platformTracker = new PlayerPlatformTracker(world, player, this.platform)
    this.groundDetector = new PlayerGroundDetector(world, player, this)
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

    if (!this.flying) {
      this.updateStandardPhysics(delta, snare)
    } else {
      this.updateFlyingPhysics(delta)
    }

    this.updateBuildModeFlying()

    this.player.jumpPressed = false
  }

  updateAnchorState(anchor) {
    const DISABLE_SIMULATION = this.world.PHYSX.PxActorFlagEnum.eDISABLE_SIMULATION

    if (anchor && !this.player.capsuleDisabled) {
      this.player.capsule.setActorFlag(DISABLE_SIMULATION, true)
      this.player.capsuleDisabled = true
    } else if (!anchor && this.player.capsuleDisabled) {
      this.player.capsule.setActorFlag(DISABLE_SIMULATION, false)
      this.player.capsuleDisabled = false
    }
  }

  updateStandardPhysics(delta, snare) {
    this.platformTracker.update(this.grounded)
    this.groundDetector.detect()
    this.groundDetector.handleSteepSlopes()
    this.physicsState.updateMaterialFriction()
    this.physicsState.updateJumpFallState(delta)
    this.physicsState.updateGravityAndVelocity(delta, snare)
    this.physicsState.applyMovementForce(snare)
    this.physicsState.handleJump()
  }

  updateFlyingPhysics(delta) {
    this.physicsState.updateFlyingPhysics(delta)
  }

  updateBuildModeFlying() {
    this.physicsState.updateBuildModeFlying()
  }

  push(force) {
    const v1 = new THREE.Vector3()
    this.pushForce = v1.copy(force)
    this.pushForceInit = false
  }

  getState() {
    return {
      grounded: this.grounded,
      falling: this.falling,
      jumping: this.jumping,
      fallDistance: this.fallDistance,
    }
  }
}
