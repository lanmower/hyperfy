import * as pc from '../playcanvas.js'

function cloneEntity(entity) {
  // For Three.js objects, use clone() if available
  if (typeof entity.clone === 'function') {
    const cloned = entity.clone(true)
    // Recursively clone children if not already handled by clone()
    if (entity.children && entity.children.length > 0 && (!cloned.children || cloned.children.length === 0)) {
      for (let i = 0; i < entity.children.length; i++) {
        cloned.add(cloneEntity(entity.children[i]))
      }
    }
    return cloned
  }

  // Fallback for PlayCanvas entities
  const cloned = new pc.Entity(entity.name)
  if (entity.getLocalPosition) {
    cloned.setLocalPosition(entity.getLocalPosition())
  }
  if (entity.getLocalRotation) {
    cloned.setLocalRotation(entity.getLocalRotation())
  }
  if (entity.getLocalScale) {
    cloned.setLocalScale(entity.getLocalScale())
  }
  if (entity.model) {
    cloned.addComponent('model', { asset: entity.model.asset })
  }
  if (entity.script) {
    for (const scriptName in entity.script) {
      if (entity.script.hasOwnProperty(scriptName)) {
        cloned.addComponent('script')
        cloned.script[scriptName] = entity.script[scriptName]
      }
    }
  }
  if (entity.children) {
    for (let i = 0; i < entity.children.length; i++) {
      cloned.addChild(cloneEntity(entity.children[i]))
    }
  }
  return cloned
}

export function cloneGLB(glb) {
  return { ...glb, scene: cloneEntity(glb.scene) }
}

export function getSkinnedMeshes(scene) {
  const meshes = []
  function traverse(entity) {
    // Check for Three.js skinned meshes
    if (entity.isSkinnedMesh) {
      meshes.push(entity)
    }
    // Check for PlayCanvas skinned meshes
    if (entity.model && entity.model.skinInstances && entity.model.skinInstances.length > 0) {
      meshes.push(entity)
    }
    // Traverse children
    if (entity.children && entity.children.length > 0) {
      for (let i = 0; i < entity.children.length; i++) {
        traverse(entity.children[i])
      }
    }
  }
  traverse(scene)
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
