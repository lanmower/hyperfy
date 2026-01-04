import { Vec3 } from '../extras/playcanvas.js'
import { simpleCamLerp } from '../extras/simpleCamLerp.js'
import { SharedVectorPool } from '../utils/SharedVectorPool.js'

const UP = new Vec3(0, 1, 0)
const FORWARD = new Vec3(0, 0, -1)
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
      const pos = player.base.getLocalPosition()
      const rot = player.base.getLocalRotation()
      pos.copy(new Vec3(anchor.m00, anchor.m10, anchor.m20))
      const pose = player.capsule.getGlobalPose()
      player.base.setLocalPosition(pos)
      player.capsuleHandle.snap(pose)
    }

    const cam = player.cam
    const camPos = cam.getLocalPosition()
    camPos.copy(player.base.getLocalPosition())

    if (!player.world.xr?.session) {
      camPos.y += player.camHeight

      if (!player.firstPerson) {
        const forward = v1.copy(FORWARD)
        const camRot = cam.getLocalRotation()
        forward.applyQuaternion(camRot)
        const right = v2.copy(forward).cross(UP).normalize()
        camPos.add(right.scale(0.3))
      }
    }
    cam.setLocalPosition(camPos)
  }

  static syncControlCamera(player, delta) {
    if (player.world.xr?.session) {
      if (player.control?.camera) {
        const ctrlPos = player.control.camera.getLocalPosition()
        const ctrlRot = player.control.camera.getLocalRotation()
        ctrlPos.copy(player.cam.getLocalPosition())
        ctrlRot.copy(player.cam.getLocalRotation())
        player.control.camera.setLocalPosition(ctrlPos)
        player.control.camera.setLocalRotation(ctrlRot)
      }
    } else if (player.control?.camera) {
      simpleCamLerp(player.world, player.control.camera, player.cam, delta)
      if (window.__DEBUG__) {
        const dist = player.control.camera.getLocalPosition().distance(player.cam.getLocalPosition())
        window.__DEBUG__.cameraDist = dist
        window.__DEBUG__.cameraZoom = player.control.camera.zoom || 1
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
