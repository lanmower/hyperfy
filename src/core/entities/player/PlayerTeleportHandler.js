import * as THREE from '../../extras/three.js'
import { isNumber } from 'lodash-es'

const position = new THREE.Vector3()

export class PlayerTeleportHandler {
  constructor(player) {
    this.player = player
  }

  teleport({ position: pos, rotationY }) {
    position.copy(pos.isVector3 ? pos : new THREE.Vector3().fromArray(pos))
    const hasRotation = isNumber(rotationY)
    const pose = this.player.capsule.getGlobalPose()
    position.toPxTransform(pose)
    this.player.capsuleHandle.snap(pose)
    this.player.base.position.copy(position)
    if (hasRotation) this.player.base.rotation.y = rotationY
    this.player.world.network.send('entityModified', {
      id: this.player.data.id,
      p: this.player.base.position.toArray(),
      q: this.player.base.quaternion.toArray(),
      t: true,
    })
    this.player.cam.position.copy(this.player.base.position)
    this.player.cam.position.y += this.player.camHeight
    if (hasRotation) this.player.cam.rotation.y = rotationY
    if (this.player.control?.camera) {
      this.player.control.camera.position.copy(this.player.cam.position)
      this.player.control.camera.quaternion.copy(this.player.cam.quaternion)
    }
  }
}
