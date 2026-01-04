import * as pc from '../../extras/playcanvas.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'
import { PARTICLE_ATTRIBUTES } from './ParticleGeometryBuilder.js'

const { v1, v2 } = SharedVectorPool('EmitterController', 2)

export class EmitterController {
  constructor(id, node, meshInstances, worker, next, buffers, camera, stage) {
    this.id = id
    this.node = node
    this.meshInstances = meshInstances
    this.worker = worker
    this.next = next
    this.buffers = buffers
    this.camera = camera
    this.stage = stage
    this.matrixWorld = node.matrixWorld
    this.pending = false
    this.skippedDelta = 0
    this.particleCount = 0
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
        this.next[name] = this.buffers[name]
        this.buffers[name] = msg[name]
      }
      this.particleCount = n
      this.updateMeshInstances(n)
      this.pending = false
    }
    if (msg.op === 'end') {
      this.node._onEnd?.()
    }
  }

  updateMeshInstances(count) {
    for (let i = 0; i < this.meshInstances.length; i++) {
      const mi = this.meshInstances[i]
      if (i < count) {
        const aPos = this.buffers.aPosition
        const pos = new pc.Vec3(aPos[i * 3], aPos[i * 3 + 1], aPos[i * 3 + 2])
        if (mi.node) {
          mi.node.setLocalPosition(pos)
        }
        mi.visible = true
      } else {
        mi.visible = false
      }
    }
  }

  update(delta) {
    const camPos = this.camera.getLocalPosition ? this.camera.getLocalPosition() : new pc.Vec3()
    const worldPos = this.matrixWorld.getTranslation(new pc.Vec3())

    const distance = camPos.distance(worldPos)
    for (const mi of this.meshInstances) {
      if (mi) mi.renderOrder = -distance
    }

    if (this.pending) {
      this.skippedDelta += delta
    } else {
      delta += this.skippedDelta
      this.skippedDelta = 0
      const msgData = {
        op: 'update',
        delta,
        camPosition: [camPos.x, camPos.y, camPos.z],
        matrixWorld: this.matrixWorld.data,
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
  }
}
