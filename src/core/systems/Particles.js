// Particle system with instanced rendering, custom shaders, worker physics
import { System } from './System.js'
import * as THREE from '../extras/three.js'
import { DEG2RAD } from '../extras/general.js'
import { uuid } from '../utils.js'
import { ParticleGeometryBuilder } from './particles/ParticleGeometryBuilder.js'
import { ParticleMaterialFactory } from './particles/ParticleMaterialFactory.js'
import { ParticleWorkerCoordinator } from './particles/ParticleWorkerCoordinator.js'

const e1 = new THREE.Euler(0, 0, 0, 'YXZ')
const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const arr1 = []
const arr2 = []

const billboardModeInts = {
  full: 0,
  y: 1,
  direction: 2,
}

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
    this.emitters = new Map() // id -> emitter
  }

  init() {
    this.worker = getWorker()
    this.worker.onmessage = this.onMessage
    this.worker.onerror = this.onError
  }

  start() {
  }

  register(node) {
    const id = uuid()
    const config = node.getConfig()

    const { geometry, attributes } = ParticleGeometryBuilder.create(node._max)
    const { aPosition, aRotation, aDirection, aSize, aColor, aAlpha, aEmissive, aUV } = attributes

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

    let matrixWorld = node.matrixWorld
    let pending = false
    let skippedDelta = 0

    const send = (msg, transfers) => {
      msg.emitterId = id
      this.worker.postMessage(msg, transfers)
    }

    const setEmitting = (value) => {
      send({ op: 'emitting', value })
    }

    const onMessage = (msg) => {
      if (msg.op === 'update') {
        const n = msg.n

        next.aPosition = aPosition.array
        next.aRotation = aRotation.array
        next.aDirection = aDirection.array
        next.aSize = aSize.array
        next.aColor = aColor.array
        next.aAlpha = aAlpha.array
        next.aEmissive = aEmissive.array
        next.aUV = aUV.array

        aPosition.array = msg.aPosition
        aPosition.addUpdateRange(0, n * 3)
        aPosition.needsUpdate = true
        aRotation.array = msg.aRotation
        aRotation.addUpdateRange(0, n * 1)
        aRotation.needsUpdate = true
        aDirection.array = msg.aDirection
        aDirection.addUpdateRange(0, n * 3)
        aDirection.needsUpdate = true
        aSize.array = msg.aSize
        aSize.addUpdateRange(0, n * 1)
        aSize.needsUpdate = true
        aColor.array = msg.aColor
        aColor.addUpdateRange(0, n * 3)
        aColor.needsUpdate = true
        aAlpha.array = msg.aAlpha
        aAlpha.addUpdateRange(0, n * 1)
        aAlpha.needsUpdate = true
        aEmissive.array = msg.aEmissive
        aEmissive.addUpdateRange(0, n * 1)
        aEmissive.needsUpdate = true
        aUV.array = msg.aUV
        aUV.addUpdateRange(0, n * 4)
        aUV.needsUpdate = true

        mesh.count = n
        pending = false
      }
      if (msg.op === 'end') {
        node._onEnd?.()
      }
    }

    const update = (delta) => {
      const camPosition = v1.setFromMatrixPosition(this.camera.matrixWorld)
      const worldPosition = v2.setFromMatrixPosition(matrixWorld)

      const distance = camPosition.distanceTo(worldPosition)
      mesh.renderOrder = -distance

      if (pending) {
        skippedDelta += delta
      } else {
        delta += skippedDelta
        skippedDelta = 0
        const aPosition = next.aPosition
        const aRotation = next.aRotation
        const aDirection = next.aDirection
        const aSize = next.aSize
        const aColor = next.aColor
        const aAlpha = next.aAlpha
        const aEmissive = next.aEmissive
        const aUV = next.aUV
        pending = true
        send(
          {
            op: 'update',
            delta,
            camPosition: camPosition.toArray(arr1),
            matrixWorld: matrixWorld.toArray(arr2),
            aPosition,
            aRotation,
            aDirection,
            aSize,
            aColor,
            aAlpha,
            aEmissive,
            aUV,
          },
          [
            aPosition.buffer,
            aRotation.buffer,
            aDirection.buffer,
            aSize.buffer,
            aColor.buffer,
            aAlpha.buffer,
            aEmissive.buffer,
            aUV.buffer,
          ]
        )
      }
    }

    const destroy = () => {
      this.emitters.delete(id)
      this.worker.postMessage({ op: 'destroy', emitterId: id })
      this.stage.scene.remove(mesh)
      mesh.material.dispose()
      mesh.geometry.dispose()
    }

    const handle = {
      id,
      node,
      send,
      setEmitting,
      onMessage,
      update,
      destroy,
    }
    this.emitters.set(id, handle)
    this.worker.postMessage({ op: 'create', id, ...config })
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
    this.uOrientationFull.value = session ? this.xr.camera.quaternion : this.rig.quaternion
  }
}
