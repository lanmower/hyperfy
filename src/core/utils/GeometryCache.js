import * as THREE from '../extras/three.js'

class GeometryCache {
  constructor() {
    this.boxes = {}
    this.spheres = {}
    this.planes = {}
    this.custom = {}
  }

  getBox(width, height, depth) {
    const key = `${width},${height},${depth}`
    if (!this.boxes[key]) {
      this.boxes[key] = new THREE.BoxGeometry(width, height, depth)
    }
    return this.boxes[key]
  }

  getSphere(radius, widthSegments = 16, heightSegments = 12) {
    const key = `${radius},${widthSegments},${heightSegments}`
    if (!this.spheres[key]) {
      this.spheres[key] = new THREE.SphereGeometry(radius, widthSegments, heightSegments)
    }
    return this.spheres[key]
  }

  getPlane(width, height) {
    const key = `${width},${height}`
    if (!this.planes[key]) {
      this.planes[key] = new THREE.PlaneGeometry(width, height)
    }
    return this.planes[key]
  }

  getCustom(key, createFn) {
    if (!this.custom[key]) {
      this.custom[key] = createFn()
    }
    return this.custom[key]
  }

  clear() {
    this.boxes = {}
    this.spheres = {}
    this.planes = {}
    this.custom = {}
  }
}

export const geometryCache = new GeometryCache()
