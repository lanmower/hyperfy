import * as THREE from '../extras/three.js'

export class GraphicsAPIGeometry {
  createBoxGeometry(width, height, depth) {
    return new THREE.BoxGeometry(width, height, depth)
  }

  createSphereGeometry(radius, widthSegments = 32, heightSegments = 32) {
    return new THREE.SphereGeometry(radius, widthSegments, heightSegments)
  }

  createCylinderGeometry(radiusTop, radiusBottom, height, radialSegments = 32) {
    return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
  }

  createConeGeometry(radius, height, radialSegments = 32) {
    return new THREE.ConeGeometry(radius, height, radialSegments)
  }

  createTorusGeometry(radius, tube, radialSegments = 100, tubularSegments = 100) {
    return new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments)
  }

  createPlaneGeometry(width, height) {
    return new THREE.PlaneGeometry(width, height)
  }

  createMaterial(type = 'standard', props = {}) {
    const defaults = {
      metalness: props.metalness ?? 0.5,
      roughness: props.roughness ?? 0.5,
      color: props.color ?? 0xffffff,
      emissive: props.emissive ?? 0x000000,
      transparent: props.transparent ?? false,
      opacity: props.opacity ?? 1,
      side: props.side ?? THREE.FrontSide,
    }

    if (type === 'standard') {
      return new THREE.MeshStandardMaterial(defaults)
    } else if (type === 'phong') {
      return new THREE.MeshPhongMaterial(defaults)
    } else if (type === 'basic') {
      return new THREE.MeshBasicMaterial(defaults)
    }

    return new THREE.MeshStandardMaterial(defaults)
  }

  createMesh(geometry, material) {
    return new THREE.Mesh(geometry, material)
  }
}
