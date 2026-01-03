import * as THREE from '../extras/three.js'
import { StructuredLogger } from '../utils/logging/index.js'
import { VectorPool, QuaternionPool, MatrixPool } from './GraphicsAPIPools.js'
import { GraphicsAPIGeometry } from './GraphicsAPIGeometry.js'

const logger = new StructuredLogger('GraphicsAPI')

export class GraphicsAPI {
  constructor() {
    this.vectors = new VectorPool()
    this.quaternions = new QuaternionPool()
    this.matrices = new MatrixPool()
    this.geometry = new GraphicsAPIGeometry()
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

  createBoxGeometry(width, height, depth) {
    return this.geometry.createBoxGeometry(width, height, depth)
  }

  createSphereGeometry(radius, widthSegments = 32, heightSegments = 32) {
    return this.geometry.createSphereGeometry(radius, widthSegments, heightSegments)
  }

  createCylinderGeometry(radiusTop, radiusBottom, height, radialSegments = 32) {
    return this.geometry.createCylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
  }

  createConeGeometry(radius, height, radialSegments = 32) {
    return this.geometry.createConeGeometry(radius, height, radialSegments)
  }

  createTorusGeometry(radius, tube, radialSegments = 100, tubularSegments = 100) {
    return this.geometry.createTorusGeometry(radius, tube, radialSegments, tubularSegments)
  }

  createPlaneGeometry(width, height) {
    return this.geometry.createPlaneGeometry(width, height)
  }

  createMaterial(type = 'standard', props = {}) {
    return this.geometry.createMaterial(type, props)
  }

  createMesh(geometry, material) {
    return this.geometry.createMesh(geometry, material)
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
    const color = props.color ?? 0xffffff
    const intensity = props.intensity ?? 1
    if (type === 'directional') {
      const l = new THREE.DirectionalLight(color, intensity)
      if (props.position) l.position.fromArray(props.position)
      return l
    } else if (type === 'ambient') {
      return new THREE.AmbientLight(color, intensity)
    } else if (type === 'point') {
      const l = new THREE.PointLight(color, intensity)
      if (props.distance) l.distance = props.distance
      if (props.decay) l.decay = props.decay
      return l
    } else if (type === 'spot') {
      const l = new THREE.SpotLight(color, intensity)
      if (props.angle) l.angle = props.angle
      if (props.penumbra) l.penumbra = props.penumbra
      return l
    }
    return new THREE.DirectionalLight(color, intensity)
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
    object?.traverse?.(callback)
  }

  getChildren(object) {
    return object?.children || []
  }

  clone(object) {
    return object?.clone?.() || null
  }

  dispose(object) {
    if (!object) return
    object.geometry?.dispose?.()
    if (Array.isArray(object.material)) {
      object.material.forEach(m => m.dispose?.())
    } else {
      object.material?.dispose?.()
    }
    object.dispose?.()
  }
}

export const graphics = new GraphicsAPI()
