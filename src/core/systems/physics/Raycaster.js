import * as THREE from '../../extras/three.js'

export class Raycaster {
  constructor(physics) {
    this.physics = physics
  }

  raycast(origin, direction, distance, mask) {
    if (!origin || !direction) return null

    const from = this.toPhysXVector(origin)
    const dir = this.toPhysXVector(direction)

    return this.physics.raycast(from, dir, distance, mask)
  }

  castRay(origin, direction, maxDistance = 1000) {
    const hit = this.raycast(origin, direction, maxDistance, 0xFFFFFFFF)

    if (!hit) return null

    return {
      distance: hit.distance,
      position: this.fromPhysXVector(hit.position),
      normal: this.fromPhysXVector(hit.normal),
      actor: hit.actor,
      handle: hit.handle,
    }
  }

  toPhysXVector(v) {
    if (v.toPxVec3) return v.toPxVec3()
    return this.physics.createVector(v.x, v.y, v.z)
  }

  fromPhysXVector(pxVec) {
    return new THREE.Vector3(pxVec.x, pxVec.y, pxVec.z)
  }

  sweep(geometry, origin, direction, distance, mask) {
    return this.physics.sweep(geometry, origin, direction, distance, mask)
  }
}
