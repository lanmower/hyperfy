import * as THREE from '../extras/three.js'
import { simpleCamLerp } from '../extras/simpleCamLerp.js'
import { SharedVectorPool } from '../utils/SharedVectorPool.js'

const UP = new THREE.Vector3(0, 1, 0)
const FORWARD = new THREE.Vector3(0, 0, -1)
const { v1, v2 } = SharedVectorPool('PlayerLocalCameraManager', 2, 0, 0)

export class PlayerLocalCameraManager {
  static getCam(player) {
    return player.controller.camera
  }

  static getCamHeight(player) {
    return player.controller.camera.camHeight
  }

  static setCamHeight(player, value) {
    player.controller.camera.camHeight = value
  }

  static updateCameraPosition(player, delta) {
    const anchor = player.getAnchorMatrix()

    if (anchor) {
      player.base.position.setFromMatrixPosition(anchor)
      player.base.quaternion.setFromRotationMatrix(anchor)
      const pose = player.capsule.getGlobalPose()
      player.base.position.toPxTransform(pose)
      player.capsuleHandle.snap(pose)
    }

    const cam = player.cam
    cam.position.copy(player.base.position)

    if (!player.world.xr?.session) {
      cam.position.y += player.camHeight

      if (!player.firstPerson) {
        const forward = v1.copy(FORWARD).applyQuaternion(cam.quaternion)
        const right = v2.crossVectors(forward, UP).normalize()
        cam.position.add(right.multiplyScalar(0.3))
      }
    }
  }

  static syncControlCamera(player, delta) {
    if (player.world.xr?.session) {
      if (player.control?.camera) {
        player.control.camera.position.copy(player.cam.position)
        player.control.camera.quaternion.copy(player.cam.quaternion)
      }
    } else if (player.control?.camera) {
      simpleCamLerp(player.world, player.control.camera, player.cam, delta)
      if (window.__DEBUG__) {
        window.__DEBUG__.cameraDist = player.control.camera.position.distanceTo(
          player.cam.position
        )
        window.__DEBUG__.cameraZoom = player.control.camera.zoom
      }
    }
  }

  static cleanupControl(player) {
    if (player.control) {
      player.control.release()
      player.control = null
    }
  }
}
