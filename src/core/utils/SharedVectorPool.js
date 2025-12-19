import * as THREE from '../extras/three.js'

const pools = new Map()

export function SharedVectorPool(name, vectorCount = 0, quaternionCount = 0) {
  if (pools.has(name)) {
    return pools.get(name)
  }

  const pool = {}

  for (let i = 1; i <= vectorCount; i++) {
    pool[`v${i}`] = new THREE.Vector3()
  }

  for (let i = 1; i <= quaternionCount; i++) {
    pool[`q${i}`] = new THREE.Quaternion()
  }

  pools.set(name, pool)
  return pool
}
