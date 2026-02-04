// Minimal Quaternion implementation

export class Quaternion {
  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }

  set(x, y, z, w) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
    return this
  }

  copy(q) {
    this.x = q.x
    this.y = q.y
    this.z = q.z
    this.w = q.w
    return this
  }

  multiply(q) {
    const ax = this.x, ay = this.y, az = this.z, aw = this.w
    const bx = q.x, by = q.y, bz = q.z, bw = q.w

    this.x = ax * bw + aw * bx + ay * bz - az * by
    this.y = ay * bw + aw * by + az * bx - ax * bz
    this.z = az * bw + aw * bz + ax * by - ay * bx
    this.w = aw * bw - ax * bx - ay * by - az * bz

    return this
  }

  conjugate() {
    this.x *= -1
    this.y *= -1
    this.z *= -1
    return this
  }

  normalize() {
    const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w)
    if (len > 0) {
      this.x /= len
      this.y /= len
      this.z /= len
      this.w /= len
    }
    return this
  }

  toArray() {
    return [this.x, this.y, this.z, this.w]
  }

  static fromArray(arr) {
    return new Quaternion(arr[0], arr[1], arr[2], arr[3])
  }

  static fromEuler(x, y, z) {
    const q = new Quaternion()
    const sx = Math.sin(x / 2)
    const cx = Math.cos(x / 2)
    const sy = Math.sin(y / 2)
    const cy = Math.cos(y / 2)
    const sz = Math.sin(z / 2)
    const cz = Math.cos(z / 2)

    q.x = sx * cy * cz + cx * sy * sz
    q.y = cx * sy * cz - sx * cy * sz
    q.z = cx * cy * sz - sx * sy * cz
    q.w = cx * cy * cz + sx * sy * sz

    return q
  }
}
