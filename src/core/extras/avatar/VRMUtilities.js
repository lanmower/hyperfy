import * as pc from '../../playcanvas.js'

function cloneEntity(entity) {
  const cloned = new pc.Entity(entity.name)
  cloned.setLocalPosition(entity.getLocalPosition())
  cloned.setLocalRotation(entity.getLocalRotation())
  cloned.setLocalScale(entity.getLocalScale())
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
  for (let i = 0; i < entity.children.length; i++) {
    cloned.addChild(cloneEntity(entity.children[i]))
  }
  return cloned
}

export function cloneGLB(glb) {
  return { ...glb, scene: cloneEntity(glb.scene) }
}

export function getSkinnedMeshes(scene) {
  const meshes = []
  function traverse(entity) {
    if (entity.model && entity.model.skinInstances && entity.model.skinInstances.length > 0) {
      meshes.push(entity)
    }
    for (let i = 0; i < entity.children.length; i++) {
      traverse(entity.children[i])
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
