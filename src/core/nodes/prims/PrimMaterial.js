import * as pc from '../../extras/playcanvas.js'

const materialCache = new Map()

export function getMaterial(props) {
  const cacheKey = `${props.metalness}_${props.roughness}_${props.opacity}_${props.texture}_${props.doubleside}`

  if (materialCache.has(cacheKey)) {
    return materialCache.get(cacheKey)
  }

  const material = new pc.StandardMaterial()
  material.diffuse.set(1, 1, 1)
  material.emissive.set(0, 0, 0)
  material.metalness = props.metalness
  material.roughness = props.roughness
  material.opacity = props.opacity
  material.transparent = props.opacity < 1
  material.twoSided = props.doubleside || false
  material.update()

  materialCache.set(cacheKey, material)
  return material
}

export function applyTexture(material, textureUrl, loader) {
  if (!material._texPromise) {
    material._texPromise = new Promise(async resolve => {
      let texture = loader?.get('texture', textureUrl)
      if (!texture && loader?.load) {
        texture = await loader.load('texture', textureUrl)
      }
      if (texture) {
        material.diffuseMap = texture
        material._texApplied = true
        material.update()
      }
      resolve()
    })
  }
  return material._texPromise
}

export function quantizeOpacity(opacity) {
  if (opacity >= 0.99) return 1
  if (opacity <= 0.01) return 0
  return Math.round(opacity * 20) / 20
}

export function getCacheStats() {
  return {
    materials: materialCache.size,
    cacheSize: materialCache,
  }
}

export function getMaterialCache() {
  return materialCache
}
