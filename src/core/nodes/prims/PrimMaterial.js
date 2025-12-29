import * as THREE from '../../extras/three.js'

const materialCache = new Map()

export function getMaterial(props) {
  const cacheKey = `${props.metalness}_${props.roughness}_${props.opacity}_${props.texture}_${props.doubleside}`

  if (materialCache.has(cacheKey)) {
    return materialCache.get(cacheKey)
  }

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x000000,
    emissiveIntensity: 0,
    metalness: props.metalness,
    roughness: props.roughness,
    opacity: props.opacity,
    transparent: props.opacity < 1,
    side: props.doubleside ? THREE.DoubleSide : THREE.FrontSide,
    shadowSide: THREE.BackSide,
    polygonOffset: true,
    polygonOffsetFactor: Math.random(),
    polygonOffsetUnits: Math.random(),
  })

  materialCache.set(cacheKey, material)
  return material
}

export function applyTexture(material, textureUrl, loader) {
  if (!material._texPromise) {
    material._texPromise = new Promise(async resolve => {
      let texture = loader.get('texture', textureUrl)
      if (!texture) texture = await loader.load('texture', textureUrl)
      material.map = texture
      material._texApplied = true
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
