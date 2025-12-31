import * as THREE from '../extras/three.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('GraphicsAPI')

export class GraphicsAPI {
  constructor() {
    this.vectors = new VectorPool()
    this.quaternions = new QuaternionPool()
    this.matrices = new MatrixPool()
  }

  createVector(x = 0, y = 0, z = 0) {
    return new THREE.Vector3(x, y, z)
  }

  createQuaternion(x = 0, y = 0, z = 0, w = 1) {
    return new THREE.Quaternion(x, y, z, w)
  }

  createMatrix4() {
    return new THREE.Matrix4()
  }

  createObject3D() {
    return new THREE.Object3D()
  }

  createGroup() {
    return new THREE.Group()
  }

  createMesh(geometry, material) {
    return new THREE.Mesh(geometry, material)
  }

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

  createScene() {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    return scene
  }

  createCamera(type = 'perspective', width = 800, height = 600) {
    if (type === 'perspective') {
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
      camera.position.z = 5
      return camera
    } else if (type === 'orthographic') {
      return new THREE.OrthographicCamera(
        -width / 2,
        width / 2,
        height / 2,
        -height / 2,
        0.1,
        1000
      )
    }
    return new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  }

  createLight(type = 'directional', props = {}) {
    const defaults = {
      color: props.color ?? 0xffffff,
      intensity: props.intensity ?? 1,
    }

    if (type === 'directional') {
      const light = new THREE.DirectionalLight(defaults.color, defaults.intensity)
      if (props.position) light.position.fromArray(props.position)
      return light
    } else if (type === 'ambient') {
      return new THREE.AmbientLight(defaults.color, defaults.intensity)
    } else if (type === 'point') {
      const light = new THREE.PointLight(defaults.color, defaults.intensity)
      if (props.distance) light.distance = props.distance
      if (props.decay) light.decay = props.decay
      return light
    } else if (type === 'spot') {
      const light = new THREE.SpotLight(defaults.color, defaults.intensity)
      if (props.angle) light.angle = props.angle
      if (props.penumbra) light.penumbra = props.penumbra
      return light
    }

    return new THREE.DirectionalLight(defaults.color, defaults.intensity)
  }

  addToScene(scene, object) {
    if (!scene || !object) return
    scene.add(object)
  }

  removeFromScene(scene, object) {
    if (!scene || !object) return
    scene.remove(object)
  }

  setPosition(object, x, y, z) {
    if (!object?.position) return
    object.position.set(x, y, z)
  }

  setQuaternion(object, x, y, z, w) {
    if (!object?.quaternion) return
    object.quaternion.set(x, y, z, w)
  }

  setScale(object, x = 1, y = 1, z = 1) {
    if (!object?.scale) return
    object.scale.set(x, y, z)
  }

  updateMatrixWorld(object, force = false) {
    if (!object) return
    object.updateMatrixWorld(force)
  }

  updateMatrix(object) {
    if (!object) return
    object.updateMatrix()
  }

  getWorldPosition(object, target = null) {
    if (!object) return null
    target = target || new THREE.Vector3()
    object.getWorldPosition(target)
    return target
  }

  getWorldQuaternion(object, target = null) {
    if (!object) return null
    target = target || new THREE.Quaternion()
    object.getWorldQuaternion(target)
    return target
  }

  raycast(raycaster, objects) {
    if (!raycaster) return []
    return raycaster.intersectObjects(objects)
  }

  traverse(object, callback) {
    if (!object) return
    object.traverse(callback)
  }

  getChildren(object) {
    return object?.children || []
  }

  clone(object) {
    if (!object) return null
    return object.clone()
  }

  dispose(object) {
    if (!object) return

    if (object.geometry) {
      object.geometry.dispose()
    }

    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(m => m.dispose())
      } else {
        object.material.dispose()
      }
    }

    if (object.dispose) {
      object.dispose()
    }
  }
}

class VectorPool {
  constructor(size = 1000) {
    this.pool = []
    this.size = size
    this.index = 0
    for (let i = 0; i < size; i++) {
      this.pool.push(new THREE.Vector3())
    }
  }

  get() {
    const vec = this.pool[this.index]
    this.index = (this.index + 1) % this.size
    return vec.set(0, 0, 0)
  }

  reset() {
    this.index = 0
  }
}

class QuaternionPool {
  constructor(size = 500) {
    this.pool = []
    this.size = size
    this.index = 0
    for (let i = 0; i < size; i++) {
      this.pool.push(new THREE.Quaternion())
    }
  }

  get() {
    const quat = this.pool[this.index]
    this.index = (this.index + 1) % this.size
    return quat.set(0, 0, 0, 1)
  }

  reset() {
    this.index = 0
  }
}

class MatrixPool {
  constructor(size = 500) {
    this.pool = []
    this.size = size
    this.index = 0
    for (let i = 0; i < size; i++) {
      this.pool.push(new THREE.Matrix4())
    }
  }

  get() {
    const matrix = this.pool[this.index]
    this.index = (this.index + 1) % this.size
    return matrix.identity()
  }

  reset() {
    this.index = 0
  }
}

export const graphics = new GraphicsAPI()
