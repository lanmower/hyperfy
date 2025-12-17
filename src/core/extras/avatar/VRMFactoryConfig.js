import * as THREE from './three.js'

export const DIST_MIN_RATE = 1 / 5
export const DIST_MAX_RATE = 1 / 60
export const DIST_MIN = 5
export const DIST_MAX = 60
export const MAX_GAZE_DISTANCE = 40

export const AimAxis = {
  X: new THREE.Vector3(1, 0, 0),
  Y: new THREE.Vector3(0, 1, 0),
  Z: new THREE.Vector3(0, 0, 1),
  NEG_X: new THREE.Vector3(-1, 0, 0),
  NEG_Y: new THREE.Vector3(0, -1, 0),
  NEG_Z: new THREE.Vector3(0, 0, -1),
}

export const UpAxis = {
  X: new THREE.Vector3(1, 0, 0),
  Y: new THREE.Vector3(0, 1, 0),
  Z: new THREE.Vector3(0, 0, 1),
  NEG_X: new THREE.Vector3(-1, 0, 0),
  NEG_Y: new THREE.Vector3(0, -1, 0),
  NEG_Z: new THREE.Vector3(0, 0, -1),
}
