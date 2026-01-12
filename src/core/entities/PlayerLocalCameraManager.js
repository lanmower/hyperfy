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
    const basePos = player.base?.getLocalPosition?.() || { x: 0, y: 0, z: 0 }
    const camPos = v1.copy(basePos)
    camPos.y += player.camHeight

    if (!player.world.xr?.session) {
      if (!player.firstPerson) {
        const forward = v2.copy(FORWARD)
        forward.applyQuaternion(cam.quaternion)
        const right = forward.clone().cross(UP).normalize()
        camPos.x += right.x * 0.3
        camPos.y += right.y * 0.3
        camPos.z += right.z * 0.3
      }
    }
    cam.position.copy(camPos)
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
        const dist = player.control.camera.position.distanceTo(player.cam.position)
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
