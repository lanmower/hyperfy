/**
 * Player Physics System
 *
 * Encapsulates all player physics calculations and interactions.
 * Handles:
 * - Ground detection and platform tracking
 * - Jump and fall state machine
 * - Gravity and velocity management
 * - Movement forces and directional input
 * - Flying mode physics
 * - Push/knockback forces
 */

import * as THREE from '../../extras/three.js'
import { Layers } from '../../extras/Layers.js'
import { PhysicsConfig } from '../../config/SystemConfig.js'

const UP = new THREE.Vector3(0, 1, 0)
const DOWN = new THREE.Vector3(0, -1, 0)
const SCALE_IDENTITY = new THREE.Vector3(1, 1, 1)
const RAD2DEG = 180 / Math.PI

// Vector pool to avoid allocations
const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const v3 = new THREE.Vector3()
const v4 = new THREE.Vector3()
const v5 = new THREE.Vector3()
const v6 = new THREE.Vector3()

const q1 = new THREE.Quaternion()
const q2 = new THREE.Quaternion()
const q3 = new THREE.Quaternion()
const q4 = new THREE.Quaternion()

const m1 = new THREE.Matrix4()
const m2 = new THREE.Matrix4()
const m3 = new THREE.Matrix4()

const e1 = new THREE.Euler()

export class PlayerPhysics {
  constructor(world, player) {
    this.world = world
    this.player = player

    // Physics configuration
    this.mass = player.mass
    this.gravity = PhysicsConfig.GRAVITY
    this.jumpHeight = PhysicsConfig.JUMP_HEIGHT
    this.effectiveGravity = this.mass * this.gravity

    // Ground state
    this.grounded = false
    this.groundAngle = 0
    this.groundNormal = new THREE.Vector3(0, 1, 0)
    this.groundSweepRadius = PhysicsConfig.GROUND_DETECTION_RADIUS

    // Jump/Fall state
    this.jumped = false
    this.jumping = false
    this.justLeftGround = false
    this.falling = false
    this.fallTimer = 0
    this.fallDistance = 0
    this.fallStartY = 0
    this.airJumped = false
    this.airJumping = false

    // Movement
    this.moveDir = new THREE.Vector3()
    this.moving = false

    // Platform tracking
    this.platform = {
      actor: null,
      prevTransform: new THREE.Matrix4(),
    }

    // Slope detection
    this.slipping = false

    // Push force (knockback/launch)
    this.pushForce = null
    this.pushForceInit = false

    // Flight mode
    this.flying = false
    this.flyForce = PhysicsConfig.FLY_FORCE_MULTIPLIER
    this.flyDrag = PhysicsConfig.FLY_DRAG
    this.flyDir = new THREE.Vector3()

    // Material friction tracking
    this.materialMax = null

    // Jump timing
    this.lastJumpAt = 0
  }

  /**
   * Main physics update - called once per physics frame
   */
  update(delta) {
    const freeze = this.player.data.effect?.freeze
    const anchor = this.player.getAnchorMatrix()
    const snare = this.player.data.effect?.snare || 0

    // Handle anchor freezing
    this.updateAnchorState(anchor)

    if (anchor) {
      // Anchored - no physics updates needed
      return
    }

    if (!this.flying) {
      this.updateStandardPhysics(delta, snare)
    } else {
      this.updateFlyingPhysics(delta)
    }

    // Handle double-jump for build mode flying
    this.updateBuildModeFlying()

    // Consume jump press
    this.player.jumpPressed = false
  }

  /**
   * Update anchor freeze state
   */
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

  /**
   * Standard ground-based physics
   */
  updateStandardPhysics(delta, snare) {
    // Platform tracking
    this.updatePlatformTracking()

    // Ground detection
    this.detectGround()

    // Handle steep slopes
    this.handleSteepSlopes()

    // Update material friction based on ground state
    this.updateMaterialFriction()

    // Jump/fall state machine
    this.updateJumpFallState(delta)

    // Gravity and velocity
    this.updateGravityAndVelocity(delta, snare)

    // Movement forces
    this.applyMovementForce(snare)

    // Jump handling
    this.handleJump()
  }

  /**
   * Track moving platforms and move player with them
   */
  updatePlatformTracking() {
    if (!this.grounded) {
      this.platform.actor = null
      return
    }

    // Find any potentially moving platform
    const pose = this.player.capsule.getGlobalPose()
    const origin = v1.copy(pose.p)
    origin.y += 0.2
    const hitMask = Layers.environment.group | Layers.prop.group
    const hit = this.world.physics.raycast(origin, DOWN, 2, hitMask)
    const actor = hit?.handle?.actor || null

    // If we found a new platform, set it up for tracking
    if (this.platform.actor !== actor) {
      this.platform.actor = actor
      if (actor) {
        const platformPose = actor.getGlobalPose()
        v1.copy(platformPose.p)
        q1.copy(platformPose.q)
        this.platform.prevTransform.compose(v1, q1, SCALE_IDENTITY)
      }
    }

    // Move with platform
    if (this.platform.actor) {
      this.applyPlatformDeltaTransform()
    }
  }

  /**
   * Apply platform's delta transform to player
   */
  applyPlatformDeltaTransform() {
    // Get current platform transform
    const currTransform = m1
    const platformPose = this.platform.actor.getGlobalPose()
    v1.copy(platformPose.p)
    q1.copy(platformPose.q)
    currTransform.compose(v1, q1, SCALE_IDENTITY)

    // Get delta transform
    const deltaTransform = m2.multiplyMatrices(
      currTransform,
      this.platform.prevTransform.clone().invert()
    )

    // Extract delta position and quaternion
    const deltaPosition = v2
    const deltaQuaternion = q2
    const deltaScale = v3
    deltaTransform.decompose(deltaPosition, deltaQuaternion, deltaScale)

    // Apply delta to player
    const playerPose = this.player.capsule.getGlobalPose()
    v4.copy(playerPose.p)
    q3.copy(playerPose.q)
    const playerTransform = m3
    playerTransform.compose(v4, q3, SCALE_IDENTITY)
    playerTransform.premultiply(deltaTransform)

    const newPosition = v5
    const newQuaternion = q4
    playerTransform.decompose(newPosition, newQuaternion, v6)

    const newPose = this.player.capsule.getGlobalPose()
    newPosition.toPxTransform(newPose)
    this.player.capsule.setGlobalPose(newPose)

    // Rotate base by Y only
    e1.setFromQuaternion(deltaQuaternion).reorder('YXZ')
    e1.x = 0
    e1.z = 0
    q1.setFromEuler(e1)
    this.player.base.quaternion.multiply(q1)
    this.player.base.updateTransform()

    // Store current transform for next frame
    this.platform.prevTransform.copy(currTransform)
  }

  /**
   * Detect ground via sweep
   */
  detectGround() {
    const geometry = this.player.groundSweepGeometry
    const pose = this.player.capsule.getGlobalPose()
    const origin = v1.copy(pose.p)
    origin.y += this.groundSweepRadius + 0.12
    const direction = DOWN
    const maxDistance = 0.12 + 0.1
    const hitMask = Layers.environment.group | Layers.prop.group

    const sweepHit = this.world.physics.sweep(
      geometry,
      origin,
      direction,
      maxDistance,
      hitMask
    )

    // Update grounded info
    if (sweepHit) {
      this.justLeftGround = false
      this.grounded = true
      this.groundNormal.copy(sweepHit.normal)
      this.groundAngle = UP.angleTo(this.groundNormal) * RAD2DEG
    } else {
      this.justLeftGround = !!this.grounded
      this.grounded = false
      this.groundNormal.copy(UP)
      this.groundAngle = 0
    }
  }

  /**
   * Handle steep slope detection and slipping
   */
  handleSteepSlopes() {
    if (this.grounded && this.groundAngle > 60) {
      this.justLeftGround = false
      this.grounded = false
      this.groundNormal.copy(UP)
      this.groundAngle = 0
      this.slipping = true
    } else {
      this.slipping = false
    }
  }

  /**
   * Update material friction based on ground state
   * eMIN in air = zero friction (don't stick to walls)
   * eMAX on ground = absorb object friction (don't slip)
   */
  updateMaterialFriction() {
    const PHYSX = this.world.PHYSX
    const eMAX = PHYSX.PxCombineModeEnum.eMAX
    const eMIN = PHYSX.PxCombineModeEnum.eMIN

    if (this.grounded) {
      if (this.materialMax !== true) {
        this.player.material.setFrictionCombineMode(eMAX)
        this.player.material.setRestitutionCombineMode(eMAX)
        this.materialMax = true
      }
    } else {
      if (this.materialMax !== false) {
        this.player.material.setFrictionCombineMode(eMIN)
        this.player.material.setRestitutionCombineMode(eMIN)
        this.materialMax = false
      }
    }
  }

  /**
   * Jump/fall state machine
   */
  updateJumpFallState(delta) {
    // If we jumped and have now left the ground, progress to jumping
    if (this.jumped && !this.grounded) {
      this.jumped = false
      this.jumping = true
    }

    // If not grounded and velocity is downward, start timing fall
    if (!this.grounded && this.player.capsule.getLinearVelocity().y < 0) {
      this.fallTimer += delta
    } else {
      this.fallTimer = 0
    }

    // If we've been falling for a bit, progress to actual falling
    if (this.fallTimer > 0.1 && !this.falling) {
      this.jumping = false
      this.airJumping = false
      this.falling = true
      this.fallStartY = this.player.base.position.y
    }

    // Track fall distance
    if (this.falling) {
      this.fallDistance = this.fallStartY - this.player.base.position.y
    }

    // If falling and now on ground, clear it
    if (this.falling && this.grounded) {
      this.falling = false
    }

    // If jumping and now on ground, clear it
    if (this.jumping && this.grounded) {
      this.jumping = false
    }

    // If air jumping and now on ground, clear it
    if (this.airJumped && this.grounded) {
      this.airJumped = false
      this.airJumping = false
    }
  }

  /**
   * Update gravity and velocity
   */
  updateGravityAndVelocity(delta, snare) {
    const PHYSX = this.world.PHYSX

    // Apply gravity
    if (this.grounded) {
      // On ground: gravity disabled, but apply force to dynamic platforms
      if (this.platform.actor) {
        const isStatic = this.platform.actor instanceof PHYSX.PxRigidStatic
        const isKinematic = this.platform.actor
          .getRigidBodyFlags?.()
          .isSet(PHYSX.PxRigidBodyFlagEnum.eKINEMATIC)

        if (!isKinematic && !isStatic) {
          const amount = -9.81 * 0.2
          const force = v1.set(0, amount, 0)
          PHYSX.PxRigidBodyExt.prototype.addForceAtPos(
            this.platform.actor,
            force.toPxVec3(),
            this.player.capsule.getGlobalPose().p,
            PHYSX.PxForceModeEnum.eFORCE,
            true
          )
        }
      }
    } else {
      // In air: apply gravity
      const force = v1.set(0, -this.effectiveGravity, 0)
      this.player.capsule.addForce(force.toPxVec3(), PHYSX.PxForceModeEnum.eFORCE, true)
    }

    // Update velocity
    const velocity = v1.copy(this.player.capsule.getLinearVelocity())

    // Apply drag oriented to ground normal (prevents ice-skating)
    const dragCoeff = 10 * delta
    const perpComponent = v2.copy(this.groundNormal).multiplyScalar(velocity.dot(this.groundNormal))
    const parallelComponent = v3.copy(velocity).sub(perpComponent)
    parallelComponent.multiplyScalar(1 - dragCoeff)
    velocity.copy(parallelComponent.add(perpComponent))

    // Cancel velocity in ground normal direction (helps stick to elevators)
    if (this.grounded && !this.jumping) {
      const projectedLength = velocity.dot(this.groundNormal)
      const projectedVector = v2.copy(this.groundNormal).multiplyScalar(projectedLength)
      velocity.sub(projectedVector)
    }

    // Snap down when walking off edge or ramp
    if (this.justLeftGround && !this.jumping) {
      velocity.y = -5
    }

    // Ensure we can't gain upward velocity on slope
    if (this.slipping) {
      velocity.y -= 0.5
    }

    // Apply push force
    if (this.pushForce) {
      if (!this.pushForceInit) {
        this.pushForceInit = true
        // If pushing up, act like jump so we don't stick to ground
        if (this.pushForce.y) {
          this.jumped = true
          this.jumping = false
          this.falling = false
          this.airJumped = false
          this.airJumping = false
        }
      }
      velocity.add(this.pushForce)

      // Decay push force
      const drag = 20
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

    this.player.capsule.setLinearVelocity(velocity.toPxVec3())
  }

  /**
   * Apply movement force projected onto ground normal
   */
  applyMovementForce(snare) {
    if (!this.moving) return

    const moveSpeed = (this.player.running ? 6 : 3) * this.mass
    const adjustedSpeed = moveSpeed * (1 - snare)

    const slopeRotation = q1.setFromUnitVectors(UP, this.groundNormal)
    const moveForce = v1
      .copy(this.moveDir)
      .multiplyScalar(adjustedSpeed * 10)
      .applyQuaternion(slopeRotation)

    this.player.capsule.addForce(moveForce.toPxVec3(), this.world.PHYSX.PxForceModeEnum.eFORCE, true)
  }

  /**
   * Handle jump input
   */
  handleJump() {
    const PHYSX = this.world.PHYSX

    const shouldJump =
      this.grounded &&
      !this.jumping &&
      this.player.jumpDown &&
      !this.player.data.effect?.snare &&
      !this.player.data.effect?.freeze

    const shouldAirJump =
      false && !this.grounded && !this.airJumped && this.player.jumpPressed && !this.world.builder?.enabled // temp: disabled

    if (shouldJump || shouldAirJump) {
      // Calculate velocity needed to reach jump height
      let jumpVelocity = Math.sqrt(2 * this.effectiveGravity * this.jumpHeight)
      jumpVelocity = jumpVelocity * (1 / Math.sqrt(this.mass))

      const velocity = this.player.capsule.getLinearVelocity()
      velocity.y = jumpVelocity
      this.player.capsule.setLinearVelocity(velocity)

      // Ground jump
      if (shouldJump) {
        this.jumped = true
      }

      // Air jump
      if (shouldAirJump) {
        this.falling = false
        this.fallTimer = 0
        this.jumping = true
        this.airJumped = true
        this.airJumping = true
      }
    }
  }

  /**
   * Flying mode physics
   */
  updateFlyingPhysics(delta) {
    const PHYSX = this.world.PHYSX

    // Apply force in flight direction
    if (this.moving || this.player.jumpDown || this.player.control?.keyC?.down) {
      const flySpeed = this.flyForce * (this.player.running ? 2 : 1)
      const force = v1.copy(this.flyDir).multiplyScalar(flySpeed)

      if (this.player.jumpDown) {
        force.y = flySpeed
      } else if (this.player.control?.keyC?.down) {
        force.y = -flySpeed
      }

      this.player.capsule.addForce(force.toPxVec3(), PHYSX.PxForceModeEnum.eFORCE, true)
    }

    // Add drag to prevent excessive speeds
    const velocity = v2.copy(this.player.capsule.getLinearVelocity())
    const dragForce = v3.copy(velocity).multiplyScalar(-this.flyDrag * delta)
    this.player.capsule.addForce(dragForce.toPxVec3(), PHYSX.PxForceModeEnum.eFORCE, true)

    // Zero out rotational velocity
    const zeroAngular = v4.set(0, 0, 0)
    this.player.capsule.setAngularVelocity(zeroAngular.toPxVec3())

    // Exit flying if not in build mode
    if (!this.world.builder?.enabled) {
      this.flying = false
    }
  }

  /**
   * Handle double-jump to toggle flying in build mode
   */
  updateBuildModeFlying() {
    if (this.player.jumpPressed && this.world.builder?.enabled) {
      if (this.world.time - this.lastJumpAt < 0.4) {
        this.flying = !this.flying
      }
      this.lastJumpAt = this.world.time
    }
  }

  /**
   * Apply push/knockback force
   */
  push(force) {
    this.pushForce = v1.copy(force)
    this.pushForceInit = false
  }

  /**
   * Get state for serialization
   */
  getState() {
    return {
      grounded: this.grounded,
      falling: this.falling,
      jumping: this.jumping,
      fallDistance: this.fallDistance,
    }
  }
}
