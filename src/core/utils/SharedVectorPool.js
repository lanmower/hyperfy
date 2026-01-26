class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x; this.y = y; this.z = z
  }
  copy(v) {
    this.x = v.x; this.y = v.y; this.z = v.z
    return this
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
  }
  normalize() {
    const len = this.length()
    if (len > 0) { this.x /= len; this.y /= len; this.z /= len }
    return this
  }
  applyQuaternion(q) {
    const x = this.x, y = this.y, z = this.z;
    const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
    const ix =  qw * x + qy * z - qz * y;
    const iy =  qw * y + qz * x - qx * z;
    const iz =  qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;
    this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return this
  }
  distanceTo(v) {
    const dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
  set(x, y, z) {
    this.x = x; this.y = y; this.z = z
    return this
  }
  add(v) {
    this.x += v.x; this.y += v.y; this.z += v.z
    return this
  }
  sub(v) {
    this.x -= v.x; this.y -= v.y; this.z -= v.z
    return this
  }
  multiplyScalar(s) {
    this.x *= s; this.y *= s; this.z *= s
    return this
  }
  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z
  }
  cross(v) {
    const x = this.y * v.z - this.z * v.y;
    const y = this.z * v.x - this.x * v.z;
    const z = this.x * v.y - this.y * v.x;
    this.x = x; this.y = y; this.z = z
    return this
  }
  reorder(order) {
    const q = new Quat().setFromEuler(this);
    const e = q.toEuler();
    const orders = { 'XYZ': () => e, 'YXZ': () => ({ x: e.y, y: e.x, z: e.z }) };
    const reordered = (orders[order] || orders['XYZ'])();
    this.x = reordered.x; this.y = reordered.y; this.z = reordered.z;
    return this
  }
  toPxVec3() {
    if (!globalThis.PHYSX) return { x: this.x, y: this.y, z: this.z };
    return new globalThis.PHYSX.PxVec3(this.x, this.y, this.z);
  }
  applyAxisAngle(axis, angle) {
    const q = new Quat().setFromAxisAngle(axis, angle);
    return this.applyQuaternion(q);
  }
  clone() {
    return new Vec3(this.x, this.y, this.z);
  }
}

class Quat {
  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x; this.y = y; this.z = z; this.w = w
  }
  setFromAxisAngle(axis, angle) {
    const halfAngle = angle / 2, s = Math.sin(halfAngle);
    this.x = axis.x * s; this.y = axis.y * s; this.z = axis.z * s; this.w = Math.cos(halfAngle);
    return this
  }
  setFromEuler(euler) {
    const c1 = Math.cos(euler.x / 2);
    const c2 = Math.cos(euler.y / 2);
    const c3 = Math.cos(euler.z / 2);
    const s1 = Math.sin(euler.x / 2);
    const s2 = Math.sin(euler.y / 2);
    const s3 = Math.sin(euler.z / 2);
    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 + s1 * s2 * c3;
    this.w = c1 * c2 * c3 - s1 * s2 * s3;
    return this;
  }
  toEuler() {
    const x = this.x, y = this.y, z = this.z, w = this.w;
    const sinr_cosp = 2 * (w * x + y * z);
    const cosr_cosp = 1 - 2 * (x * x + y * y);
    const r = Math.atan2(sinr_cosp, cosr_cosp);
    const sinp = 2 * (w * y - z * x);
    const p = Math.abs(sinp) >= 1 ? Math.PI / 2 * Math.sign(sinp) : Math.asin(sinp);
    const siny_cosp = 2 * (w * z + x * y);
    const cosy_cosp = 1 - 2 * (y * y + z * z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);
    return { x: r, y: p, z: yaw };
  }
  copy(q) {
    this.x = q.x; this.y = q.y; this.z = q.z; this.w = q.w
    return this
  }
  slerp(q, t) {
    let dot = this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w;
    if (dot < 0) { q = { x: -q.x, y: -q.y, z: -q.z, w: -q.w }; dot = -dot; }
    const clampedDot = Math.max(-1, Math.min(1, dot));
    const theta = Math.acos(clampedDot) * t;
    const s = Math.sin(theta), s1 = Math.cos(theta) - dot * s;
    this.x = this.x * s1 + q.x * s;
    this.y = this.y * s1 + q.y * s;
    this.z = this.z * s1 + q.z * s;
    this.w = this.w * s1 + q.w * s;
    return this
  }
}

const pools = new Map()

function SharedVectorPool(name, vectorCount = 0, quaternionCount = 0, eulerCount = 0, matrixCount = 0) {
  if (pools.has(name)) {
    return pools.get(name)
  }

  const pool = {}

  for (let i = 1; i <= vectorCount; i++) {
    pool[`v${i}`] = new Vec3()
  }

  for (let i = 1; i <= quaternionCount; i++) {
    pool[`q${i}`] = new Quat()
  }

  for (let i = 1; i <= eulerCount; i++) {
    pool[`e${i}`] = new Vec3()
  }

  pools.set(name, pool)
  return pool
}

export { SharedVectorPool, Vec3, Quat }
