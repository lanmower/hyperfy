import * as pc from '../../extras/playcanvas.js'
import { defaultSizes } from './PrimDefaults.js'

const geometryCache = new Map()

export function getGeometry(type, size) {
  const key = `${type}${JSON.stringify(size)}`
  let geometry = geometryCache.get(key)
  if (!geometry) {
    const device = pc.GraphicsDevice.instance
    if (!device) {
      throw new Error('[PrimGeometry] GraphicsDevice not initialized')
    }

    switch (type) {
      case 'box': {
        const [width, height, depth] = size
        geometry = pc.createBox(device, {
          halfExtents: new pc.Vec3(width / 2, height / 2, depth / 2)
        })
        break
      }
      case 'sphere': {
        const [radius] = size
        geometry = pc.createSphere(device, {
          radius: radius,
          segments: 20
        })
        break
      }
      case 'cylinder': {
        const [radiusTop, radiusBot, height] = size
        geometry = pc.createCylinder(device, {
          radius: (radiusTop + radiusBot) / 2,
          height: height,
          segments: 20
        })
        break
      }
      case 'cone': {
        const [radius, height] = size
        geometry = pc.createCone(device, {
          baseRadius: radius,
          peakRadius: 0,
          height: height,
          segments: 16
        })
        break
      }
      case 'torus': {
        const [innerRadius, tubeRadius] = size
        geometry = pc.createTorus(device, {
          tubeRadius: tubeRadius,
          ringRadius: innerRadius,
          segments: 20,
          sides: 12
        })
        break
      }
      case 'plane': {
        const [width, height] = size
        geometry = pc.createPlane(device, {
          halfExtents: new pc.Vec2(width / 2, height / 2),
          widthSegments: 1,
          lengthSegments: 1
        })
        break
      }
      default:
        geometry = pc.createBox(device, {
          halfExtents: new pc.Vec3(0.5, 0.5, 0.5)
        })
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
