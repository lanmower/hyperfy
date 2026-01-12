import { System } from './System.js'
import * as pc from '../extras/playcanvas.js'
import { uuid } from '../utils.js'
import { ParticleGeometryBuilder } from './particles/ParticleGeometryBuilder.js'
import { ParticleMaterialFactory } from './particles/ParticleMaterialFactory.js'
import { EmitterController } from './particles/EmitterController.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('Particles')
const billboardModeInts = { full: 0, y: 1, direction: 2 }

let worker = null
function getWorker() {
  if (!worker) {
    worker = new Worker(window.PARTICLES_PATH, { type: 'module' })
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
    this.uOrientationFull = new pc.Quat()
    this.uOrientationY = new pc.Quat()
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
    const { geometry, buffers } = ParticleGeometryBuilder.create(node._max)
    const next = ParticleGeometryBuilder.createNextBuffers(node._max)

    const uniforms = {
      uBillboard: billboardModeInts[node._billboard],
      uOrientation: node._billboard === 'full' ? this.uOrientationFull : this.uOrientationY,
    }

    const material = ParticleMaterialFactory.create({ node, uniforms, loader: this.loader })

    const entity = new pc.Entity('particle-emitter')
    entity.addComponent('render', {
      type: 'asset',
      meshInstances: Array(node._max).fill(null).map(() => new pc.MeshInstance(geometry, material))
    })

    const pos = node.matrixWorld.getTranslation(new pc.Vec3())
    const rot = node.matrixWorld.getRotation(new pc.Quat())
    entity.setLocalPosition(pos)
    entity.setLocalRotation(rot)
    entity.castShadow = false
    entity.receiveShadow = false

    this.stage.scene.addChild(entity)

    const controller = new EmitterController(id, node, entity.render.meshInstances, this.worker, next, buffers, this.camera, this.stage)

    const handle = {
      id,
      node,
      entity,
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
    if (!this.rig) return
    const rigQuat = this.rig.getLocalRotation?.() || new pc.Quat()

    this.uOrientationFull.copy(rigQuat)

    const eulerX = Math.atan2(2 * (rigQuat.w * rigQuat.x + rigQuat.y * rigQuat.z), 1 - 2 * (rigQuat.x * rigQuat.x + rigQuat.y * rigQuat.y))
    const eulerZ = Math.atan2(2 * (rigQuat.w * rigQuat.z + rigQuat.x * rigQuat.y), 1 - 2 * (rigQuat.y * rigQuat.y + rigQuat.z * rigQuat.z))

    const temp = new pc.Quat()
    temp.setFromEulerAngles(0, 0, 0)
    this.uOrientationY.copy(temp)

    this.emitters.forEach(emitter => {
      emitter.update(delta)
    })
  }

  onMessage = msg => {
    msg = msg.data
    if (msg.op === 'error' || msg.op === 'worker-error') {
      logger.error('Particle worker error', { error: msg.error, stack: msg.stack })
      return
    }
    this.emitters.get(msg.emitterId)?.onMessage(msg)
  }

  onError = err => {
    let message = 'Unknown error'
    let stack = null
    let filename = null
    let lineno = null

    if (err instanceof Error) {
      message = err.message
      stack = err.stack
    } else if (err?.message) {
      message = err.message
      filename = err.filename
      lineno = err.lineno
    } else if (typeof err === 'string') {
      message = err
    }

    logger.error('Particle system error', { message, filename, lineno, stack })
  }

  onXRSession = session => {
    if (session && this.xr?.camera) {
      this.uOrientationFull.copy(this.xr.camera.getLocalRotation?.() || new pc.Quat())
    } else {
      this.uOrientationFull.copy(this.rig.getLocalRotation?.() || new pc.Quat())
    }
  }

  destroy() {
    if (this.worker) {
      this.worker.onmessage = null
      this.worker.onerror = null
      this.worker.terminate()
      this.worker = null
    }
    worker = null
  }
}
