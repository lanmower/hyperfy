import * as THREE from '../../extras/three.js'
import { isNumber } from 'lodash-es'
import { createMaterialProxy } from './MaterialProxy.js'

export class MaterialFactory {
  constructor(world) {
    this.world = world
  }

  createMaterial(options = {}) {
    const material = {}
    let raw

    if (options.raw) {
      raw = options.raw.clone()
      raw.onBeforeCompile = options.raw.onBeforeCompile
    } else if (options.unlit) {
      raw = new THREE.MeshBasicMaterial({
        color: options.color || 'white',
      })
    } else {
      raw = new THREE.MeshStandardMaterial({
        color: options.color || 'white',
        metalness: isNumber(options.metalness) ? options.metalness : 0,
        roughness: isNumber(options.roughness) ? options.roughness : 1,
      })
    }

    raw.shadowSide = THREE.BackSide

    const textures = []
    if (raw.map) {
      raw.map = raw.map.clone()
      textures.push(raw.map)
    }
    if (raw.emissiveMap) {
      raw.emissiveMap = raw.emissiveMap.clone()
      textures.push(raw.emissiveMap)
    }
    if (raw.normalMap) {
      raw.normalMap = raw.normalMap.clone()
      textures.push(raw.normalMap)
    }
    if (raw.bumpMap) {
      raw.bumpMap = raw.bumpMap.clone()
      textures.push(raw.bumpMap)
    }
    if (raw.roughnessMap) {
      raw.roughnessMap = raw.roughnessMap.clone()
      textures.push(raw.roughnessMap)
    }
    if (raw.metalnessMap) {
      raw.metalnessMap = raw.metalnessMap.clone()
      textures.push(raw.metalnessMap)
    }

    this.world.setupMaterial(raw)

    const proxy = createMaterialProxy(raw, textures, material, this.world)

    material.raw = raw
    material.proxy = proxy
    return material
  }
}
