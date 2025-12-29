import * as THREE from '../../extras/three.js'
import { defaultSizes } from './PrimDefaults.js'

const geometryCache = new Map()

export function getGeometry(type, size) {
  const key = `${type}${size}`
  let geometry = geometryCache.get(key)
  if (!geometry) {
    switch (type) {
      case 'box': {
        const [width, height, depth] = size
        geometry = new THREE.BoxGeometry(width, height, depth)
        break
      }
      case 'sphere': {
        const [radius] = size
        geometry = new THREE.SphereGeometry(radius, 20, 12)
        break
      }
      case 'cylinder': {
        const [radiusTop, radiusBtm, height] = size
        geometry = new THREE.CylinderGeometry(radiusTop, radiusBtm, height, 20)
        break
      }
      case 'cone': {
        const [radius, height] = size
        geometry = new THREE.ConeGeometry(radius, height, 16)
        break
      }
      case 'torus': {
        const [innerRadius, tubeRadius] = size
        geometry = new THREE.TorusGeometry(innerRadius, tubeRadius, 12, 30)
        break
      }
      case 'plane': {
        const [width, height] = size
        geometry = new THREE.PlaneGeometry(width, height)
        break
      }
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1)
    }
    geometryCache.set(key, geometry)
  }
  return geometryCache.get(key)
}

export function getGeometryConfig(type, requestedSize) {
  let size
  let scaleOffset

  switch (type) {
    case 'box': {
      size = [1, 1, 1]
      scaleOffset = [...requestedSize]
      break
    }

    case 'sphere': {
      size = [1]
      scaleOffset = [requestedSize[0], requestedSize[0], requestedSize[0]]
      break
    }

    case 'cylinder': {
      const [rt, rb, h] = requestedSize
      if (rt === rb) {
        size = [1, 1, 1]
        scaleOffset = [rt, h, rt]
      } else {
        const maxR = Math.max(rt, rb)
        size = [rt / maxR, rb / maxR, 1]
        scaleOffset = [maxR, h, maxR]
      }
      break
    }

    case 'cone': {
      size = [1, 1]
      const [r, h] = requestedSize
      scaleOffset = [r, h, r]
      break
    }

    case 'torus': {
      const [r, tube] = requestedSize
      size = [1, tube / r]
      scaleOffset = [r, r, r]
      break
    }

    case 'plane': {
      size = [1, 1]
      scaleOffset = [...requestedSize, 1]
      break
    }

    default: {
      size = [1, 1, 1]
      scaleOffset = [1, 1, 1]
    }
  }

  return { size, scaleOffset }
}

export function getCacheStats() {
  return {
    geometries: geometryCache.size,
    cacheSize: geometryCache,
  }
}

export function isUniformScale(vec3) {
  return vec3.x === vec3.y && vec3.y === vec3.z
}
