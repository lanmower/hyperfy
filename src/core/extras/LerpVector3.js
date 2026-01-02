import * as THREE from './three.js'

export class LerpVector3 {
  constructor(current = new THREE.Vector3(), target = new THREE.Vector3(), speed = 1) {
    this.current = current
    this.target = target
    this.speed = speed
  }

  push(target) {
    this.target.copy(target)
    return this
  }

  update(delta) {
    const distance = this.current.distanceTo(this.target)
    if (distance < 0.001) return this

    const maxDistance = this.speed * delta
    this.current.lerp(this.target, Math.min(1, maxDistance / distance))
    return this
  }

  setSpeed(speed) {
    this.speed = speed
    return this
  }

  reset(position) {
    this.current.copy(position)
    this.target.copy(position)
    return this
  }

  isComplete() {
    return this.current.distanceTo(this.target) < 0.001
  }
}
