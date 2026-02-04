// Transform - position, rotation, scale combined

import { Vector3 } from './Vector3.js'
import { Quaternion } from './Quaternion.js'

export class Transform {
  constructor(position = null, rotation = null, scale = null) {
    this.position = position ? new Vector3(...position) : new Vector3()
    this.rotation = rotation ? new Quaternion(...rotation) : new Quaternion()
    this.scale = scale ? new Vector3(...scale) : new Vector3(1, 1, 1)
  }

  setPosition(x, y, z) {
    this.position.set(x, y, z)
    return this
  }

  setRotation(x, y, z, w) {
    this.rotation.set(x, y, z, w)
    return this
  }

  setScale(x, y, z) {
    this.scale.set(x, y, z)
    return this
  }

  copy(t) {
    this.position.copy(t.position)
    this.rotation.copy(t.rotation)
    this.scale.copy(t.scale)
    return this
  }

  toMatrix() {
    // Convert to 4x4 transformation matrix
    const m = new Float32Array(16)
    const x = this.rotation.x, y = this.rotation.y, z = this.rotation.z, w = this.rotation.w
    const sx = this.scale.x, sy = this.scale.y, sz = this.scale.z

    const x2 = x + x, y2 = y + y, z2 = z + z
    const xx = x * x2, xy = x * y2, xz = x * z2
    const yy = y * y2, yz = y * z2, zz = z * z2
    const wx = w * x2, wy = w * y2, wz = w * z2

    m[0] = (1 - (yy + zz)) * sx
    m[1] = (xy + wz) * sx
    m[2] = (xz - wy) * sx
    m[3] = 0

    m[4] = (xy - wz) * sy
    m[5] = (1 - (xx + zz)) * sy
    m[6] = (yz + wx) * sy
    m[7] = 0

    m[8] = (xz + wy) * sz
    m[9] = (yz - wx) * sz
    m[10] = (1 - (xx + yy)) * sz
    m[11] = 0

    m[12] = this.position.x
    m[13] = this.position.y
    m[14] = this.position.z
    m[15] = 1

    return m
  }

  toArray() {
    return {
      position: this.position.toArray(),
      rotation: this.rotation.toArray(),
      scale: this.scale.toArray()
    }
  }
}
