import * as THREE from './three.js'

export class BufferedLerpQuaternion {
  constructor() {
    this.current = { x: 0, y: 0, z: 0, w: 1 }
    this.target = { x: 0, y: 0, z: 0, w: 1 }
  }

  update(delta, speed) {
    const t = Math.min(1, delta * speed)

    const q = new THREE.Quaternion(
      this.current.x,
      this.current.y,
      this.current.z,
      this.current.w
    )
    const target = new THREE.Quaternion(
      this.target.x,
      this.target.y,
      this.target.z,
      this.target.w
    )
    q.slerp(target, t)

    this.current.x = q.x
    this.current.y = q.y
    this.current.z = q.z
    this.current.w = q.w
  }

  setTarget(x, y, z, w) {
    this.target.x = x
    this.target.y = y
    this.target.z = z
    this.target.w = w
  }
}
