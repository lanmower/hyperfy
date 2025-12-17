import * as THREE from '../../extras/three.js'
import { DEG2RAD } from '../../extras/general.js'
import { bindRotations } from '../../extras/bindRotations.js'

const DEFAULT_CAM_HEIGHT = 1.2

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
    this.rotation.x += -15 * DEG2RAD
    this.zoom = 1.5
  }

  updateForAvatar(avatar) {
    this.camHeight = avatar.height * 0.9
  }

  update(deltaTime) {
  }
}
