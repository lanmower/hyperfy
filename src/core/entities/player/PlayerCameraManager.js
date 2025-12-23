import * as THREE from '../../extras/three.js'
import { DEG2RAD } from '../../extras/general.js'
import { bindRotations } from '../../extras/bindRotations.js'
import { clamp } from '../../utils.js'
import { DEFAULT_CAM_HEIGHT, POINTER_LOOK_SPEED, PAN_LOOK_SPEED, ZOOM_SPEED, MIN_ZOOM, MAX_ZOOM } from './CameraConstants.js'
import { XRInputStrategy } from './input/XRInputStrategy.js'
import { PointerLockInputStrategy } from './input/PointerLockInputStrategy.js'
import { TouchPanInputStrategy } from './input/TouchPanInputStrategy.js'
import { ScrollZoomStrategy } from './input/ScrollZoomStrategy.js'

export class PlayerCameraManager {
  constructor(player, base) {
    this.player = player
    this.base = base
    this.camHeight = DEFAULT_CAM_HEIGHT
    this.initCamera()
  }

  initCamera() {
    this.position = new THREE.Vector3().copy(this.base.position)
    this.position.y += this.camHeight
    this.quaternion = new THREE.Quaternion()
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ')
    bindRotations(this.quaternion, this.rotation)
    this.quaternion.copy(this.base.quaternion)
    this.rotation.x = -15 * DEG2RAD
    this.quaternion.setFromEuler(this.rotation)
    this.zoom = 1.5
  }

  updateForAvatar(avatar) {
    this.camHeight = avatar.height * 0.9
  }

  updateLook(delta, isXR, control, pan) {
    const strategy = this.selectInputStrategy(isXR, control, pan)
    if (strategy) {
      strategy.updateLook(delta, control, { pan })
    }

    const zoomStrategy = new ScrollZoomStrategy(this)
    if (!isXR) {
      zoomStrategy.updateZoom(delta, control)
    }
  }

  selectInputStrategy(isXR, control, pan) {
    if (isXR) {
      if (!this.xrStrategy) this.xrStrategy = new XRInputStrategy(this)
      return this.xrStrategy
    }
    if (control.pointer.locked) {
      if (!this.pointerStrategy) this.pointerStrategy = new PointerLockInputStrategy(this)
      return this.pointerStrategy
    }
    if (pan) {
      if (!this.panStrategy) this.panStrategy = new TouchPanInputStrategy(this)
      return this.panStrategy
    }
    return null
  }

  update(deltaTime) {
  }
}
