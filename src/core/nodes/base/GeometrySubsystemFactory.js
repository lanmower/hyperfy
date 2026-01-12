/* Geometry subsystem factory pattern for Mesh, Collider, Prim nodes */
import { geometryCache } from '../../utils/GeometryCache.js'

export class GeometrySubsystemFactory {
  static getBoxGeometry(width, height, depth) {
    return geometryCache.getBox(width, height, depth)
  }

  static getSphereGeometry(radius) {
    return geometryCache.getSphere(radius)
  }

  static resolveGeometry(type, dimensions, cached = true) {
    if (type === 'box') {
      return cached
        ? this.getBoxGeometry(dimensions.width, dimensions.height, dimensions.depth)
        : this.createBoxGeometry(dimensions.width, dimensions.height, dimensions.depth)
    }
    if (type === 'sphere') {
      return cached
        ? this.getSphereGeometry(dimensions.radius)
        : this.createSphereGeometry(dimensions.radius)
    }
    if (type === 'geometry') {
      return dimensions.geometry
    }
    throw new Error(`[GeometrySubsystemFactory] Unknown geometry type: ${type}`)
  }

  static createBoxGeometry(width, height, depth) {
    const THREE = await import('../../extras/three.js')
    return new THREE.BoxGeometry(width, height, depth)
  }

  static createSphereGeometry(radius) {
    const THREE = await import('../../extras/three.js')
    return new THREE.SphereGeometry(radius, 32, 32)
  }
}
