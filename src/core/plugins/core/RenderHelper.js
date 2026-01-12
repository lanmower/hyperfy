import * as THREE from '../../extras/three.js'
import { StructuredLogger } from '../../utils/logging/index.js'
import { isNumber } from 'lodash-es'

const logger = new StructuredLogger('RenderHelper')

export class RenderHelper {
  static createMaterial(options = {}) {
    let raw

    if (options.raw) {
      raw = options.raw.clone()
      if (options.raw.onBeforeCompile) {
        raw.onBeforeCompile = options.raw.onBeforeCompile
      }
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

    return raw
  }

  static cloneTextures(material) {
    const textures = []

    if (material.map) {
      material.map = material.map.clone()
      textures.push(material.map)
    }
    if (material.emissiveMap) {
      material.emissiveMap = material.emissiveMap.clone()
      textures.push(material.emissiveMap)
    }
    if (material.normalMap) {
      material.normalMap = material.normalMap.clone()
      textures.push(material.normalMap)
    }
    if (material.bumpMap) {
      material.bumpMap = material.bumpMap.clone()
      textures.push(material.bumpMap)
    }
    if (material.roughnessMap) {
      material.roughnessMap = material.roughnessMap.clone()
      textures.push(material.roughnessMap)
    }
    if (material.metalnessMap) {
      material.metalnessMap = material.metalnessMap.clone()
      textures.push(material.metalnessMap)
    }

    return textures
  }

  static setupSceneEnvironment(scene, options = {}) {
    if (options.background) {
      scene.background = options.background
    }

    if (options.environment) {
      scene.environment = options.environment
    }

    if (options.fog) {
      scene.fog = options.fog
    }

    return scene
  }

  static raycastFromCamera(raycaster, camera, viewport, mousePosition) {
    if (!viewport) {
      logger.warn('Raycast: no viewport')
      return false
    }

    const rect = viewport.getBoundingClientRect()
    const x = ((mousePosition.x - rect.left) / rect.width) * 2 - 1
    const y = -((mousePosition.y - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
    return true
  }

  static raycastFromCenter(raycaster, camera) {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
    return true
  }

  static getSceneStats(scene) {
    let geometries = 0
    let materials = 0
    let textures = 0
    let lines = 0
    let points = 0
    let triangles = 0

    scene.traverse(obj => {
      if (obj.geometry) geometries++
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          materials += obj.material.length
        } else {
          materials++
        }
      }

      if (obj.geometry?.attributes?.position) {
        const count = obj.geometry.attributes.position.count
        if (obj instanceof THREE.LineSegments) lines += count
        else if (obj instanceof THREE.Points) points += count
        else triangles += obj.geometry.index ? obj.geometry.index.count / 3 : count / 3
      }

      if (obj.material?.map) textures++
      if (obj.material?.normalMap) textures++
      if (obj.material?.roughnessMap) textures++
      if (obj.material?.metalnessMap) textures++
    })

    return { geometries, materials, textures, lines, points, triangles }
  }

  static createGridHelper(size = 10, divisions = 10, color1 = 0x444444, color2 = 0x888888) {
    return new THREE.GridHelper(size, divisions, color1, color2)
  }

  static createAxisHelper(size = 1) {
    return new THREE.AxesHelper(size)
  }

  static addLighting(scene, options = {}) {
    const ambientIntensity = options.ambientIntensity || 0.5
    const directionalIntensity = options.directionalIntensity || 1.0

    const ambient = new THREE.AmbientLight(0xffffff, ambientIntensity)
    scene.add(ambient)

    const directional = new THREE.DirectionalLight(0xffffff, directionalIntensity)
    directional.position.set(5, 10, 7)
    directional.castShadow = true
    scene.add(directional)

    return { ambient, directional }
  }
}
