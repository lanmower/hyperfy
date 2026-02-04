import { PhysicsConfig } from '../../config/SystemConfig.js'
import * as THREE from '../../extras/three.js'
import { Layers } from '../../extras/Layers.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'

const { v1, v2, v3, v4, v5, v6, q1, q2, q3, q4, m1, m2, m3, e1 } = SharedVectorPool('PlayerPlatformTracker', 6, 4, 1, 3)

const DOWN = new THREE.Vector3(0, -1, 0)
const SCALE_IDENTITY = new THREE.Vector3(1, 1, 1)

export class PlayerPlatformTracker {
  constructor(world, player, platform) {
    this.world = world
    this.player = player
    this.platform = platform
  }

  update(grounded) {
    if (!grounded) {
      this.platform.actor = null
      return
    }

    const pose = this.player.capsule.getGlobalPose()
    const origin = v1.copy(pose.p)
    origin.y += PhysicsConfig.PLATFORM_RAYCAST_OFFSET
    const hitMask = Layers.environment.group | Layers.prop.group
    const hit = this.world.physics.raycast(origin, DOWN, 2, hitMask)
    const actor = hit?.handle?.actor || null

    if (this.platform.actor !== actor) {
      this.platform.actor = actor
      if (actor) {
        const platformPose = actor.getGlobalPose()
        v1.copy(platformPose.p)
        q1.copy(platformPose.q)
        this.platform.prevTransform.compose(v1, q1, SCALE_IDENTITY)
      }
    }

    if (this.platform.actor) {
      this.applyPlatformDeltaTransform()
    }
  }

  applyPlatformDeltaTransform() {
    const currTransform = m1
    const platformPose = this.platform.actor.getGlobalPose()
    v1.copy(platformPose.p)
    q1.copy(platformPose.q)
    currTransform.compose(v1, q1, SCALE_IDENTITY)

    const deltaTransform = m2.multiplyMatrices(
      currTransform,
      this.platform.prevTransform.clone().invert()
    )

    const deltaPosition = v2
    const deltaQuaternion = q2
    const deltaScale = v3
    deltaTransform.decompose(deltaPosition, deltaQuaternion, deltaScale)

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

    e1.setFromQuaternion(deltaQuaternion).reorder('YXZ')
    e1.x = 0
    e1.z = 0
    q1.setFromEuler(e1)
    this.player.base.quaternion.multiply(q1)
    this.player.base.updateWorldMatrix(false, false)

    this.platform.prevTransform.copy(currTransform)
  }
}
