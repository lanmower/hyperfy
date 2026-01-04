// PlayCanvas Graphics API wrapper
import { Vec3, Quat, Mat4, Entity, Color, createSphere, createCylinder, createCone, createTorus, createPlane, StandardMaterial, GraphicsDevice, Mesh, VertexBuffer, VertexFormat } from '../extras/playcanvas.js'
import { VectorPool, QuaternionPool, MatrixPool } from './GraphicsAPIPools.js'
import { GraphicsAPIGeometry } from './GraphicsAPIGeometry.js'

export class GraphicsAPI {
  constructor() {
    this.vectors = new VectorPool()
    this.quaternions = new QuaternionPool()
    this.matrices = new MatrixPool()
    this.geometry = new GraphicsAPIGeometry()
  }

  createVector(x = 0, y = 0, z = 0) {
    return new Vec3(x, y, z)
  }

  createQuaternion(x = 0, y = 0, z = 0, w = 1) {
    return new Quat(x, y, z, w)
  }

  createMatrix4() {
    return new Mat4()
  }

  createObject3D() {
    return new Entity()
  }

  createGroup() {
    return new Entity()
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
    const scene = new Entity()
    return scene
  }

  createCamera(type = 'perspective', width = 800, height = 600) {
    const entity = new Entity()
    entity.addComponent('camera', {
      fov: 75,
      near: 0.1,
      far: 1000
    })
    return entity
  }

  createLight(type = 'directional', props = {}) {
    const entity = new Entity()
    const lightType = type === 'ambient' ? 'ambient' : type === 'point' ? 'point' : type === 'spot' ? 'spot' : 'directional'

    entity.addComponent('light', {
      type: lightType,
      color: props.color ? new Color(...props.color) : new Color(1, 1, 1),
      intensity: props.intensity ?? 1,
      castShadows: true,
      shadowResolution: 2048
    })

    return entity
  }

  addToScene(scene, object) {
    if (!scene || !object) return
    scene.addChild(object)
  }

  removeFromScene(scene, object) {
    if (!scene || !object) return
    scene.removeChild(object)
  }

  setPosition(object, x, y, z) {
    if (!object) return
    object.setLocalPosition(x, y, z)
  }

  setQuaternion(object, x, y, z, w) {
    if (!object) return
    object.setLocalRotation(new Quat(x, y, z, w))
  }

  setScale(object, x = 1, y = 1, z = 1) {
    if (!object) return
    object.setLocalScale(x, y, z)
  }

  updateMatrixWorld(object, force = false) {
    if (!object) return
    object.syncHierarchy()
  }

  updateMatrix(object) {
    if (!object) return
    object.syncHierarchy()
  }

  getWorldPosition(object, target = null) {
    if (!object) return null
    target = target || new Vec3()
    return object.getWorldPosition()
  }

  getWorldQuaternion(object, target = null) {
    if (!object) return null
    target = target || new Quat()
    return object.getWorldRotation()
  }

  raycast(raycaster, objects) {
    if (!raycaster) return []
    return []
  }

  traverse(object, callback) {
    if (!object) return
    callback(object)
    if (object.children) {
      object.children.forEach(child => this.traverse(child, callback))
    }
  }

  getChildren(object) {
    return object?.children || []
  }

  clone(object) {
    if (!object) return null
    const cloned = new Entity()
    if (object.getLocalPosition) {
      cloned.setLocalPosition(object.getLocalPosition())
    }
    if (object.getLocalRotation) {
      cloned.setLocalRotation(object.getLocalRotation())
    }
    if (object.getLocalScale) {
      cloned.setLocalScale(object.getLocalScale())
    }
    return cloned
  }

  dispose(object) {
    if (!object) return
    if (object.destroy) {
      object.destroy()
    }
  }
}

export const graphics = new GraphicsAPI()
