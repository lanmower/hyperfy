import * as THREE from '../../extras/three.js'
import { Layers } from '../../extras/Layers.js'
import { PhysicsConfig } from '../../config/SystemConfig.js'

const v1 = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)
const DOWN = new THREE.Vector3(0, -1, 0)
const RAD2DEG = 180 / Math.PI

export class PlayerGroundDetector {
  constructor(world, player, physics) {
    this.world = world
    this.player = player
    this.physics = physics
  }

  detect() {
    const geometry = this.player.groundSweepGeometry
    const pose = this.player.capsule.getGlobalPose()
    const origin = v1.copy(pose.p)
    origin.y += this.physics.groundSweepRadius + 0.12
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
      this.physics.justLeftGround = false
      this.physics.grounded = true
      this.physics.groundNormal.copy(sweepHit.normal)
      this.physics.groundAngle = UP.angleTo(this.physics.groundNormal) * RAD2DEG
    } else {
      this.physics.justLeftGround = !!this.physics.grounded
      this.physics.grounded = false
      this.physics.groundNormal.copy(UP)
      this.physics.groundAngle = 0
    }
  }

  handleSteepSlopes() {
    if (this.physics.grounded && this.physics.groundAngle > 60) {
      this.physics.justLeftGround = false
      this.physics.grounded = false
      this.physics.groundNormal.copy(UP)
      this.physics.groundAngle = 0
      this.physics.slipping = true
    } else {
      this.physics.slipping = false
    }
  }
}
