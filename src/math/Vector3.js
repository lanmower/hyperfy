// Minimal Vector3 implementation

export class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x
    this.y = y
    this.z = z
  }

  set(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
    return this
  }

  copy(v) {
    this.x = v.x
    this.y = v.y
    this.z = v.z
    return this
  }

  add(v) {
    this.x += v.x
    this.y += v.y
    this.z += v.z
    return this
  }

  sub(v) {
    this.x -= v.x
    this.y -= v.y
    this.z -= v.z
    return this
  }

  scale(s) {
    this.x *= s
    this.y *= s
    this.z *= s
    return this
  }

  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z
  }

  cross(v) {
    const x = this.y * v.z - this.z * v.y
    const y = this.z * v.x - this.x * v.z
    const z = this.x * v.y - this.y * v.x
    return new Vector3(x, y, z)
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
  }

  normalize() {
    const len = this.length()
    if (len > 0) {
      this.scale(1 / len)
    }
    return this
  }

  toArray() {
    return [this.x, this.y, this.z]
  }

  static fromArray(arr) {
    return new Vector3(arr[0], arr[1], arr[2])
  }
}
