import * as THREE from '../../extras/three.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'
import { PARTICLE_ATTRIBUTES } from './ParticleGeometryBuilder.js'

const { v1, v2 } = SharedVectorPool('EmitterController', 2)
const arr1 = []
const arr2 = []

export class EmitterController {
  constructor(id, node, mesh, worker, next, attributes, camera, stage) {
    this.id = id
    this.node = node
    this.mesh = mesh
    this.worker = worker
    this.next = next
    this.attributes = attributes
    this.camera = camera
    this.stage = stage
    this.matrixWorld = node.matrixWorld
    this.pending = false
    this.skippedDelta = 0
  }

  send(msg, transfers) {
    msg.emitterId = this.id
    this.worker.postMessage(msg, transfers)
  }

  setEmitting(value) {
    this.send({ op: 'emitting', value })
  }

  onMessage(msg) {
    if (msg.op === 'update') {
      const n = msg.n
      for (const [name, size] of Object.entries(PARTICLE_ATTRIBUTES)) {
        const attr = this.attributes[name]
        this.next[name] = attr.array
        attr.array = msg[name]
        attr.addUpdateRange(0, n * size)
        attr.needsUpdate = true
      }
      this.mesh.count = n
      this.pending = false
    }
    if (msg.op === 'end') {
      this.node._onEnd?.()
    }
  }

  update(delta) {
    const camPosition = v1.setFromMatrixPosition(this.camera.matrixWorld)
    const worldPosition = v2.setFromMatrixPosition(this.matrixWorld)

    const distance = camPosition.distanceTo(worldPosition)
    this.mesh.renderOrder = -distance

    if (this.pending) {
      this.skippedDelta += delta
    } else {
      delta += this.skippedDelta
      this.skippedDelta = 0
      const msgData = {
        op: 'update',
        delta,
        camPosition: camPosition.toArray(arr1),
        matrixWorld: this.matrixWorld.toArray(arr2),
      }
      const transfers = []
      for (const name of Object.keys(PARTICLE_ATTRIBUTES)) {
        const array = this.next[name]
        msgData[name] = array
        transfers.push(array.buffer)
      }
      this.pending = true
      this.send(msgData, transfers)
    }
  }

  destroy(emittersMap) {
    emittersMap.delete(this.id)
    this.worker.postMessage({ op: 'destroy', emitterId: this.id })
    this.stage.scene.remove(this.mesh)
    this.mesh.material.dispose()
    this.mesh.geometry.dispose()
  }
}
