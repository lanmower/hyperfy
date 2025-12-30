import { System } from './System.js'
import * as THREE from '../extras/three.js'
import { uuid } from '../utils.js'
import { ParticleGeometryBuilder } from './particles/ParticleGeometryBuilder.js'
import { ParticleMaterialFactory } from './particles/ParticleMaterialFactory.js'
import { EmitterController } from './particles/EmitterController.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('Particles')
const e1 = new THREE.Euler(0, 0, 0, 'YXZ')
const billboardModeInts = { full: 0, y: 1, direction: 2 }

let worker = null
function getWorker() {
  if (!worker) {
    worker = new Worker(window.PARTICLES_PATH)
  }
  return worker
}

export class Particles extends System {
  static DEPS = {
    rig: 'rig',
    xr: 'xr',
    stage: 'stage',
    loader: 'loader',
    camera: 'camera',
    events: 'events',
  }

  static EVENTS = {
    xrSession: 'onXRSession',
  }

  constructor(world) {
    super(world)
    this.worker = null
    this.uOrientationFull = { value: this.rig.quaternion }
    this.uOrientationY = { value: new THREE.Quaternion() }
    this.emitters = new Map()
  }

  init() {
    this.worker = getWorker()
    this.worker.onmessage = this.onMessage
    this.worker.onerror = this.onError
  }

  start() {
  }

  createEmitter(node) {
    const id = uuid()
    const config = node.getConfig()
    const { geometry, attributes } = ParticleGeometryBuilder.create(node._max)
    const next = ParticleGeometryBuilder.createNextBuffers(node._max)
    const uniforms = {
      uTexture: { value: new THREE.Texture() },
      uBillboard: { value: billboardModeInts[node._billboard] },
      uOrientation: node._billboard === 'full' ? this.uOrientationFull : this.uOrientationY,
    }
    this.loader.load('texture', node._image).then(texture => {
      texture.colorSpace = THREE.SRGBColorSpace
      uniforms.uTexture.value = texture
    })
    const material = ParticleMaterialFactory.create(node, uniforms, this.loader)
    const mesh = new THREE.InstancedMesh(geometry, material, node._max)
    mesh._node = node
    mesh.count = 0
    mesh.instanceMatrix.needsUpdate = true
    mesh.frustumCulled = false
    mesh.matrixAutoUpdate = false
    mesh.matrixWorldAutoUpdate = false
    this.stage.scene.add(mesh)
    const controller = new EmitterController(id, node, mesh, this.worker, next, attributes, this.camera, this.stage)
    const handle = {
      id,
      node,
      send: controller.send.bind(controller),
      setEmitting: controller.setEmitting.bind(controller),
      onMessage: controller.onMessage.bind(controller),
      update: controller.update.bind(controller),
      destroy: controller.destroy.bind(controller),
    }
    this.worker.postMessage({ op: 'create', id, ...config })
    return handle
  }

  register(node) {
    const handle = this.createEmitter(node)
    this.emitters.set(handle.id, handle)
    return handle
  }

  update(delta) {
    e1.setFromQuaternion(this.uOrientationFull.value)
    e1.x = 0
    e1.z = 0
    this.uOrientationY.value.setFromEuler(e1)

    this.emitters.forEach(emitter => {
      emitter.update(delta)
    })
  }

  onMessage = msg => {
    msg = msg.data
    this.emitters.get(msg.emitterId)?.onMessage(msg)
  }

  onError = err => {
    logger.error('Particle system error', { error: err.message })
  }

  onXRSession = session => {
    this.uOrientationFull.value = session && this.xr?.camera ? this.xr.camera.quaternion : this.rig.quaternion
  }
}
