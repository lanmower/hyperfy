import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

export function cloneGLB(glb) {
  return { ...glb, scene: SkeletonUtils.clone(glb.scene) }
}

export function getSkinnedMeshes(scene) {
  const meshes = []
  scene.traverse(node => {
    if (node.isSkinnedMesh) {
      meshes.push(node)
    }
  })
  return meshes
}

export function createCapsule(radius, height) {
  const fullHeight = radius + height + radius
  const options = {
    radius: radius,
    height: height,
  }
  return pc.createCapsule(pc.app.graphicsDevice, options)
}

const queryParamsCache = {}
export function getQueryParams(url) {
  if (!queryParamsCache[url]) {
    const urlObj = new URL(url)
    const params = {}
    for (const [key, value] of urlObj.searchParams.entries()) {
      params[key] = value
    }
    queryParamsCache[url] = params
  }
  return queryParamsCache[url]
}
