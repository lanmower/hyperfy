import * as THREE from './three.js'

export class LerpQuaternion {
  constructor(current = new THREE.Quaternion(), target = new THREE.Quaternion(), speed = 1) {
    this.current = current
    this.target = target
    this.speed = speed
  }

  push(target) {
    this.target.copy(target)
    return this
  }

  update(delta) {
    const angle = this.current.angleTo(this.target)
    if (angle < 0.001) return this

    const maxAngle = this.speed * delta
    this.current.slerp(this.target, Math.min(1, maxAngle / angle))
    return this
  }

  setSpeed(speed) {
    this.speed = speed
    return this
  }

  reset(quaternion) {
    this.current.copy(quaternion)
    this.target.copy(quaternion)
    return this
  }

  isComplete() {
    return this.current.angleTo(this.target) < 0.001
  }
}
