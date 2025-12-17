import * as THREE from '../extras/three.js'

const tempVectorPool = {
  v1: new THREE.Vector3(),
  v2: new THREE.Vector3(),
  v3: new THREE.Vector3(),
  q1: new THREE.Quaternion(),
}

export const v = tempVectorPool.v1
export const q = tempVectorPool.q1
export const m = new THREE.Matrix4()
export const e = new THREE.Euler()
