import * as THREE from '../../extras/three.js'
import { DEG2RAD } from '../../extras/general.js'
import { bindRotations } from '../../extras/bindRotations.js'
import { clamp } from '../../utils.js'

const DEFAULT_CAM_HEIGHT = 1.2
const POINTER_LOOK_SPEED = 0.1
const PAN_LOOK_SPEED = 0.4
const ZOOM_SPEED = 2
const MIN_ZOOM = 0
const MAX_ZOOM = 8

export class PlayerCameraManager {
  constructor(player, base) {
    this.player = player
    this.base = base
    this.camHeight = DEFAULT_CAM_HEIGHT
    this.didSnapTurn = false
    this.initCamera()
  }

  initCamera() {
    this.position = new THREE.Vector3().copy(this.base.position)
    this.position.y += this.camHeight
    this.quaternion = new THREE.Quaternion()
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ')
    bindRotations(this.quaternion, this.rotation)
    this.quaternion.copy(this.base.quaternion)
    this.rotation.x += -15 * DEG2RAD
    this.zoom = 1.5
  }

  updateForAvatar(avatar) {
    this.camHeight = avatar.height * 0.9
  }

  updateLook(delta, isXR, control, pan) {
    if (isXR) {
      this.rotation.x = 0
      this.rotation.z = 0
      if (control.xrRightStick.value.x === 0 && this.didSnapTurn) {
        this.didSnapTurn = false
      } else if (control.xrRightStick.value.x > 0 && !this.didSnapTurn) {
        this.rotation.y -= 45 * DEG2RAD
        this.didSnapTurn = true
      } else if (control.xrRightStick.value.x < 0 && !this.didSnapTurn) {
        this.rotation.y += 45 * DEG2RAD
        this.didSnapTurn = true
      }
    } else if (control.pointer.locked) {
      this.rotation.x += -control.pointer.delta.y * POINTER_LOOK_SPEED * delta
      this.rotation.y += -control.pointer.delta.x * POINTER_LOOK_SPEED * delta
      this.rotation.z = 0
    } else if (pan) {
      this.rotation.x += -pan.delta.y * PAN_LOOK_SPEED * delta
      this.rotation.y += -pan.delta.x * PAN_LOOK_SPEED * delta
      this.rotation.z = 0
    }

    if (!isXR) {
      this.rotation.x = clamp(this.rotation.x, -89 * DEG2RAD, 89 * DEG2RAD)
    }

    if (!isXR) {
      this.zoom += -control.scrollDelta.value * ZOOM_SPEED * delta
      this.zoom = clamp(this.zoom, MIN_ZOOM, MAX_ZOOM)
    }
  }

  update(deltaTime) {
  }
}
