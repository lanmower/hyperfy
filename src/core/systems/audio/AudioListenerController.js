import * as THREE from '../../extras/three.js'
import { v } from '../../utils/TempVectors.js'

const up = new THREE.Vector3(0, 1, 0)

export class AudioListenerController {
  static update(listener, target, delta, ctx) {
    const dir = v[0].set(0, 0, -1).applyQuaternion(target.quaternion)
    if (listener.positionX) {
      const endTime = ctx.currentTime + delta * 2
      listener.positionX.linearRampToValueAtTime(target.position.x, endTime)
      listener.positionY.linearRampToValueAtTime(target.position.y, endTime)
      listener.positionZ.linearRampToValueAtTime(target.position.z, endTime)
      listener.forwardX.linearRampToValueAtTime(dir.x, endTime)
      listener.forwardY.linearRampToValueAtTime(dir.y, endTime)
      listener.forwardZ.linearRampToValueAtTime(dir.z, endTime)
      listener.upX.linearRampToValueAtTime(up.x, endTime)
      listener.upY.linearRampToValueAtTime(up.y, endTime)
      listener.upZ.linearRampToValueAtTime(up.z, endTime)
    } else {
      listener.setPosition(target.position.x, target.position.y, target.position.z)
      listener.setOrientation(dir.x, dir.y, dir.z, up.x, up.y, up.z)
    }
  }
}
