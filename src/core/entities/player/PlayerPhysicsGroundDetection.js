import * as THREE from '../../extras/three.js'
import { PhysicsConfig } from '../../config/SystemConfig.js'
import { Layers } from '../../extras/Layers.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'

const RAD2DEG = 180 / Math.PI
const UP = new THREE.Vector3(0, 1, 0)
const DOWN = new THREE.Vector3(0, -1, 0)
const { v1 } = SharedVectorPool('PlayerPhysicsGroundDetection', 1, 0)

export class PlayerPhysicsGroundDetection {
  constructor(world, player) {
    this.world = world
    this.player = player
    this.grounded = false
    this.groundAngle = 0
    this.groundNormal = new THREE.Vector3(0, 1, 0)
    this.groundSweepRadius = PhysicsConfig.GROUND_DETECTION_RADIUS
    this.justLeftGround = false
    this.slipping = false
    this.frameCount = 0
    this.groundCheckInterval = 2
  }

  update(wasGrounded) {
    this.frameCount++
  }

  shouldCheckGround(jumping, falling) {
    return (
      this.frameCount % this.groundCheckInterval === 0 ||
      jumping ||
      falling
    )
  }

  detectGround() {
    const geometry = this.player.groundSweepGeometry
    const pose = this.player.capsule.getGlobalPose()
    const origin = v1.copy(pose.p)
    origin.y += this.groundSweepRadius + PhysicsConfig.GROUND_SWEEP_OFFSET
    const direction = DOWN
    const maxDistance = PhysicsConfig.GROUND_SWEEP_OFFSET + PhysicsConfig.GROUND_SWEEP_DISTANCE
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

  getGroundState() {
    return {
      grounded: this.grounded,
      justLeftGround: this.justLeftGround,
      groundAngle: this.groundAngle,
      groundNormal: this.groundNormal,
      slipping: this.slipping,
    }
  }
}
