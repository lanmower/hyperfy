import * as THREE from '../extras/three.js'

export const v = [
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
]

export const q = [
  new THREE.Quaternion(),
  new THREE.Quaternion(),
  new THREE.Quaternion(),
  new THREE.Quaternion(),
]

export const m = [
  new THREE.Matrix4(),
  new THREE.Matrix4(),
  new THREE.Matrix4(),
  new THREE.Matrix4(),
]

export const e = [
  new THREE.Euler(),
  new THREE.Euler(),
]

export const box3 = new THREE.Box3()
export const sphere = new THREE.Sphere()
export const ray = new THREE.Ray()
export const plane = new THREE.Plane()
export const color = new THREE.Color()

export const TempPool = { v, q, m, e, box3, sphere, ray, plane, color }
