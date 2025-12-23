import * as THREE from '../../extras/three.js'
import { PhysicsConfig } from '../../config/SystemConfig.js'
import { Layers } from '../../extras/Layers.js'
import { PlayerPlatformTracker } from './PlayerPlatformTracker.js'
import { PlayerPhysicsState } from './PlayerPhysicsState.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'

const RAD2DEG = 180 / Math.PI
const UP = new THREE.Vector3(0, 1, 0)
const DOWN = new THREE.Vector3(0, -1, 0)

const { v1, v2, v3, v4 } = SharedVectorPool('PlayerPhysics', 4, 0)

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
    this.platformTracker.update(this.grounded)
    this.detectGround()
    this.handleSteepSlopes()
    this.physicsState.updateMaterialFriction()
    this.physicsState.updateJumpFallState(delta)
    this.updateGravityAndVelocity(delta, snare)
    this.physicsState.applyMovementForce(snare)
    this.physicsState.handleJump()
  }

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

  updateGravityAndVelocity(delta, snare) {
    const PHYSX = this.world.PHYSX || globalThis.PHYSX
    if (!PHYSX) return

    if (this.grounded) {
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
      const force = v1.set(0, -this.effectiveGravity, 0)
      this.player.capsule.addForce(force.toPxVec3(), PHYSX.PxForceModeEnum.eFORCE, true)
    }

    const velocity = v1.copy(this.player.capsule.getLinearVelocity())

    const dragCoeff = 10 * delta
    const perpComponent = v2.copy(this.groundNormal).multiplyScalar(velocity.dot(this.groundNormal))
    const parallelComponent = v3.copy(velocity).sub(perpComponent)
    parallelComponent.multiplyScalar(1 - dragCoeff)
    velocity.copy(parallelComponent.add(perpComponent))

    if (this.grounded && !this.jumping) {
      const projectedLength = velocity.dot(this.groundNormal)
      const projectedVector = v2.copy(this.groundNormal).multiplyScalar(projectedLength)
      velocity.sub(projectedVector)
    }

    if (this.justLeftGround && !this.jumping) {
      velocity.y = -5
    }

    if (this.slipping) {
      velocity.y -= 0.5
    }

    if (this.pushForce) {
      if (!this.pushForceInit) {
        this.pushForceInit = true
        if (this.pushForce.y) {
          this.jumped = true
          this.jumping = false
          this.falling = false
          this.airJumped = false
          this.airJumping = false
        }
      }
      velocity.add(this.pushForce)

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

  updateFlyingPhysics(delta) {
    const PHYSX = this.world.PHYSX || globalThis.PHYSX
    if (!PHYSX) return

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

    const velocity = v2.copy(this.player.capsule.getLinearVelocity())
    const dragForce = v3.copy(velocity).multiplyScalar(-this.flyDrag * delta)
    this.player.capsule.addForce(dragForce.toPxVec3(), PHYSX.PxForceModeEnum.eFORCE, true)

    const zeroAngular = v4.set(0, 0, 0)
    this.player.capsule.setAngularVelocity(zeroAngular.toPxVec3())

    if (!this.world.builder?.enabled) {
      this.flying = false
    }
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
