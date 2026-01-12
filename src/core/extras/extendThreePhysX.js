import * as THREE from './three.js'

export function extendThreePhysX() {
  const { Vector3, Quaternion, Matrix4 } = THREE

  const pos = new THREE.Vector3()
  const qua = new THREE.Quaternion()
  const sca = new THREE.Vector3()

  Vector3.prototype.toPxVec3 = function(pxVec3) {
    const vec = pxVec3 || new globalThis.PHYSX.PxVec3()
    vec.x = this.x
    vec.y = this.y
    vec.z = this.z
    return vec
  }

  Vector3.prototype.toPxTransform = function(transform) {
    if (!transform) return
    transform.p.x = this.x
    transform.p.y = this.y
    transform.p.z = this.z
  }

  Quaternion.prototype.toPxQuat = function(pxQuat) {
    const quat = pxQuat || new globalThis.PHYSX.PxQuat()
    quat.x = this.x
    quat.y = this.y
    quat.z = this.z
    quat.w = this.w
    return quat
  }

  Quaternion.prototype.toPxTransform = function(transform) {
    if (!transform) return
    transform.q.x = this.x
    transform.q.y = this.y
    transform.q.z = this.z
    transform.q.w = this.w
  }

  Matrix4.prototype.toPxTransform = function(transform) {
    if (!transform) return
    this.decompose(pos, qua, sca)
    transform.p.x = pos.x
    transform.p.y = pos.y
    transform.p.z = pos.z
    transform.q.x = qua.x
    transform.q.y = qua.y
    transform.q.z = qua.z
    transform.q.w = qua.w
  }
}
