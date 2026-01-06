import * as THREE from '../extras/three.js'

const pools = new Map()

function SharedVectorPool(name, vectorCount = 0, quaternionCount = 0, eulerCount = 0, matrixCount = 0) {
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

  for (let i = 1; i <= eulerCount; i++) {
    pool[`e${i}`] = new THREE.Euler()
  }

  for (let i = 1; i <= matrixCount; i++) {
    pool[`m${i}`] = new THREE.Matrix4()
  }

  pools.set(name, pool)
  return pool
}

export { SharedVectorPool }
