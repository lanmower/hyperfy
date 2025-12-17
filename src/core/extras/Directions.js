import * as THREE from './three.js'

export const UP = Object.freeze(new THREE.Vector3(0, 1, 0))
export const DOWN = Object.freeze(new THREE.Vector3(0, -1, 0))
export const FORWARD = Object.freeze(new THREE.Vector3(0, 0, -1))
export const BACKWARD = Object.freeze(new THREE.Vector3(0, 0, 1))
export const LEFT = Object.freeze(new THREE.Vector3(-1, 0, 0))
export const RIGHT = Object.freeze(new THREE.Vector3(1, 0, 0))

export const FORWARD_Z = Object.freeze(new THREE.Vector3(0, 0, 1))

export const IDENTITY_QUATERNION = Object.freeze(new THREE.Quaternion(0, 0, 0, 1))
export const IDENTITY_SCALE = Object.freeze(new THREE.Vector3(1, 1, 1))
export const IDENTITY_POSITION = Object.freeze(new THREE.Vector3(0, 0, 0))

export const Directions = { UP, DOWN, FORWARD, BACKWARD, LEFT, RIGHT, FORWARD_Z }
export const Identity = { QUATERNION: IDENTITY_QUATERNION, SCALE: IDENTITY_SCALE, POSITION: IDENTITY_POSITION }
