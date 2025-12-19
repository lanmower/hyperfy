import * as THREE from '../../extras/three.js'

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
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
      const { aPosition, aRotation, aDirection, aSize, aColor, aAlpha, aEmissive, aUV } = this.attributes

      this.next.aPosition = aPosition.array
      this.next.aRotation = aRotation.array
      this.next.aDirection = aDirection.array
      this.next.aSize = aSize.array
      this.next.aColor = aColor.array
      this.next.aAlpha = aAlpha.array
      this.next.aEmissive = aEmissive.array
      this.next.aUV = aUV.array

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
      const aPosition = this.next.aPosition
      const aRotation = this.next.aRotation
      const aDirection = this.next.aDirection
      const aSize = this.next.aSize
      const aColor = this.next.aColor
      const aAlpha = this.next.aAlpha
      const aEmissive = this.next.aEmissive
      const aUV = this.next.aUV
      this.pending = true
      this.send(
        {
          op: 'update',
          delta,
          camPosition: camPosition.toArray(arr1),
          matrixWorld: this.matrixWorld.toArray(arr2),
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

  destroy(emittersMap) {
    emittersMap.delete(this.id)
    this.worker.postMessage({ op: 'destroy', emitterId: this.id })
    this.stage.scene.remove(this.mesh)
    this.mesh.material.dispose()
    this.mesh.geometry.dispose()
  }
}
