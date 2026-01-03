import * as THREE from '../extras/three.js'

const _box3 = new THREE.Box3()
const _sphere = new THREE.Sphere()
const _points = []

export function initializeTransform(node, data) {
  const defaults = {
    active: true,
    position: [0, 0, 0],
    quaternion: [0, 0, 0, 1],
    scale: [1, 1, 1],
  }

  node.position = new THREE.Vector3()
  node.quaternion = new THREE.Quaternion()
  node.rotation = new THREE.Euler(0, 0, 0, 'YXZ')
  node.scale = new THREE.Vector3(1, 1, 1)
  node.matrixWorld = new THREE.Matrix4()
  node.matrixWorldAutoUpdate = false

  if (data.position) {
    if (Array.isArray(data.position)) {
      node.position.fromArray(data.position)
    } else {
      node.position.copy(data.position)
    }
  }

  if (data.quaternion) {
    if (Array.isArray(data.quaternion)) {
      node.quaternion.fromArray(data.quaternion)
    } else {
      node.quaternion.copy(data.quaternion)
    }
  }

  if (data.scale) {
    if (Array.isArray(data.scale)) {
      node.scale.fromArray(data.scale)
    } else {
      node.scale.copy(data.scale)
    }
  }

  node.rotation.setFromQuaternion(node.quaternion, 'YXZ')
}

export function updateTransformMatrix(node) {
  node.matrixWorld.compose(node.position, node.quaternion, node.scale)
  for (const child of node.children) {
    updateTransformMatrix(child)
  }
}

export function getWorldPosition(node, vec3) {
  vec3 = vec3 || new THREE.Vector3()
  return vec3.setFromMatrixPosition(node.matrixWorld)
}

export function getWorldMatrix(node, mat) {
  return mat ? mat.copy(node.matrixWorld) : node.matrixWorld
}

export function getStats(node, recursive, stats) {
  if (!stats) {
    stats = {
      geometries: new Set(),
      materials: new Set(),
      triangles: 0,
      textureBytes: 0,
    }
  }
  node.applyStats(stats)
  if (recursive) {
    for (const child of node.children) {
      getStats(child, recursive, stats)
    }
  }
  return stats
}
