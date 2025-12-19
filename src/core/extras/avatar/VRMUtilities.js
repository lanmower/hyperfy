import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from '../three.js'

export function cloneGLB(glb) {
  return { ...glb, scene: SkeletonUtils.clone(glb.scene) }
}

export function getSkinnedMeshes(scene) {
  let meshes = []
  scene.traverse(o => {
    if (o.isSkinnedMesh) {
      meshes.push(o)
    }
  })
  return meshes
}

export function createCapsule(radius, height) {
  const fullHeight = radius + height + radius
  const geometry = new THREE.CapsuleGeometry(radius, height)
  geometry.translate(0, fullHeight / 2, 0)
  return geometry
}

const queryParamsCache = {}
export function getQueryParams(url) {
  if (!queryParamsCache[url]) {
    url = new URL(url)
    const params = {}
    for (const [key, value] of url.searchParams.entries()) {
      params[key] = value
    }
    queryParamsCache[url] = params
  }
  return queryParamsCache[url]
}
