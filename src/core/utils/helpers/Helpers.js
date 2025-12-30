// Consolidated helper module for render, input, UI, and video operations
import * as THREE from '../../extras/three.js'
import { ComponentLogger } from '../logging/ComponentLogger.js'
import { isNumber } from 'lodash-es'

const logger = new ComponentLogger('Helpers')

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

export class InputHelper {
  static registerInput(control, eventType, handler, options = {}) {
    if (!control) {
      logger.warn('registerInput called with null control')
      return null
    }

    const listeners = control._listeners = control._listeners || {}
    if (!listeners[eventType]) {
      listeners[eventType] = []
    }

    const listener = {
      handler,
      once: options.once || false,
      capture: options.capture || false,
      passive: options.passive !== false,
    }

    listeners[eventType].push(listener)
    return () => {
      const idx = listeners[eventType].indexOf(listener)
      if (idx !== -1) listeners[eventType].splice(idx, 1)
    }
  }

  static dispatchInput(control, eventType, data) {
    if (!control) return false

    const listeners = control._listeners?.[eventType] || []
    let handled = false

    for (const listener of listeners) {
      try {
        const result = listener.handler(data)
        if (result === true) {
          handled = true
          if (!listener.passive) break
        }
      } catch (err) {
        logger.error('Input handler error', { eventType, error: err.message })
      }

      if (listener.once) {
        const idx = listeners.indexOf(listener)
        if (idx !== -1) listeners.splice(idx, 1)
      }
    }

    return handled
  }

  static removeAllListeners(control, eventType = null) {
    if (!control._listeners) return

    if (eventType) {
      delete control._listeners[eventType]
    } else {
      for (const key in control._listeners) {
        delete control._listeners[key]
      }
    }
  }

  static normalizeButtonState(buttonState) {
    return {
      down: buttonState.down || false,
      pressed: buttonState.pressed || false,
      released: buttonState.released || false,
      value: buttonState.value || 0,
    }
  }

  static normalizeVectorState(vectorState) {
    return {
      x: vectorState.x || 0,
      y: vectorState.y || 0,
      z: vectorState.z || 0,
      length: Math.sqrt((vectorState.x || 0) ** 2 + (vectorState.y || 0) ** 2 + (vectorState.z || 0) ** 2),
    }
  }

  static mergeInputConfigs(baseConfig, overrideConfig) {
    return {
      ...baseConfig,
      ...overrideConfig,
      buttons: { ...baseConfig.buttons, ...overrideConfig.buttons },
      axes: { ...baseConfig.axes, ...overrideConfig.axes },
    }
  }
}

export class UIHelper {
  static pivotGeometry(pivot, geometry, width, height) {
    const halfWidth = width / 2
    const halfHeight = height / 2
    switch (pivot) {
      case 'top-left':
        geometry.translate(halfWidth, -halfHeight, 0)
        break
      case 'top-center':
        geometry.translate(0, -halfHeight, 0)
        break
      case 'top-right':
        geometry.translate(-halfWidth, -halfHeight, 0)
        break
      case 'center-left':
        geometry.translate(halfWidth, 0, 0)
        break
      case 'center-right':
        geometry.translate(-halfWidth, 0, 0)
        break
      case 'bottom-left':
        geometry.translate(halfWidth, halfHeight, 0)
        break
      case 'bottom-center':
        geometry.translate(0, halfHeight, 0)
        break
      case 'bottom-right':
        geometry.translate(-halfWidth, halfHeight, 0)
        break
      case 'center':
      default:
        break
    }
  }

  static pivotCanvas(pivot, canvas, width, height) {
    switch (pivot) {
      case 'top-left':
        canvas.style.transform = `translate(0%, 0%)`
        break
      case 'top-center':
        canvas.style.transform = `translate(-50%, 0%)`
        break
      case 'top-right':
        canvas.style.transform = `translate(-100%, 0%)`
        break
      case 'center-left':
        canvas.style.transform = `translate(0%, -50%)`
        break
      case 'center-right':
        canvas.style.transform = `translate(-100%, -50%)`
        break
      case 'bottom-left':
        canvas.style.transform = `translate(0%, -100%)`
        break
      case 'bottom-center':
        canvas.style.transform = `translate(-50%, -100%)`
        break
      case 'bottom-right':
        canvas.style.transform = `translate(-100%, -100%)`
        break
      case 'center':
      default:
        canvas.style.transform = `translate(-50%, -50%)`
        break
    }
  }

  static getPivotOffset(pivot, width, height) {
    const halfW = width / 2
    const halfH = height / 2
    let tx = 0, ty = 0
    switch (pivot) {
      case 'top-left':
        tx = +halfW
        ty = -halfH
        break
      case 'top-center':
        tx = 0
        ty = -halfH
        break
      case 'top-right':
        tx = -halfW
        ty = -halfH
        break
      case 'center-left':
        tx = +halfW
        ty = 0
        break
      case 'center-right':
        tx = -halfW
        ty = 0
        break
      case 'bottom-left':
        tx = +halfW
        ty = +halfH
        break
      case 'bottom-center':
        tx = 0
        ty = +halfH
        break
      case 'bottom-right':
        tx = -halfW
        ty = +halfH
        break
      case 'center':
      default:
        tx = 0
        ty = 0
        break
    }

    return new THREE.Vector2(-halfW + tx, +halfH + ty)
  }
}

export class VideoHelper {
  static applyPivot(geometry, width, height, pivot) {
    if (pivot === 'center') return
    const halfWidth = width / 2
    const halfHeight = height / 2
    switch (pivot) {
      case 'top-left':
        geometry.translate(halfWidth, -halfHeight, 0)
        break
      case 'top-center':
        geometry.translate(0, -halfHeight, 0)
        break
      case 'top-right':
        geometry.translate(-halfWidth, -halfHeight, 0)
        break
      case 'center-left':
        geometry.translate(halfWidth, 0, 0)
        break
      case 'center-right':
        geometry.translate(-halfWidth, 0, 0)
        break
      case 'bottom-left':
        geometry.translate(halfWidth, halfHeight, 0)
        break
      case 'bottom-center':
        geometry.translate(0, halfHeight, 0)
        break
      case 'bottom-right':
        geometry.translate(-halfWidth, halfHeight, 0)
        break
    }
  }
}
