import { System } from './System.js'
import * as THREE from '../extras/three.js'
import { EmitterFactory } from './particles/EmitterFactory.js'

const e1 = new THREE.Euler(0, 0, 0, 'YXZ')

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

  register(node) {
    const handle = EmitterFactory.create(
      node,
      this.worker,
      this.loader,
      this.stage,
      this.camera,
      this.uOrientationFull,
      this.uOrientationY
    )
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
    console.error('[ParticleSystem]', err)
  }

  onXRSession = session => {
    this.uOrientationFull.value = session && this.xr?.camera ? this.xr.camera.quaternion : this.rig.quaternion
  }
}
