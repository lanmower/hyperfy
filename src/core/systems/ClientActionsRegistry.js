import { ControlPriorities } from '../extras/ControlPriorities.js'
import { EVENT } from '../constants/EventNames.js'
import { clamp, BatchProcessor } from '../utils.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('ClientActionsRegistry')
const BATCH_SIZE = 32

export class ClientActionsRegistry {
  constructor(clientActions) {
    this.clientActions = clientActions
    this.nodes = []
    this.cursor = 0
    this.current = { node: null, distance: Infinity }
    this.control = null
  }

  start(controls) {
    this.control = controls.bind({ priority: ControlPriorities.ACTION })
  }

  register(node) {
    this.nodes.push(node)
  }

  unregister(node) {
    const idx = this.nodes.indexOf(node)
    if (idx === -1) return
    this.nodes.splice(idx, 1)
    if (this.current.node === node) {
      this.current.node = null
      this.current.distance = Infinity
      this.clientActions.stop()
    }
  }

  update(delta, rig, events) {
    if (!rig) return false
    const cameraPos = rig.position
    const btnDown = this.control.keyE.down || this.control.touchB.down || this.control.xrLeftTrigger.down || this.control.xrRightTrigger.down

    if (this.current.node) {
      const distance = this.current.node.worldPos.distanceTo(cameraPos)
      if (distance > this.current.node._distance) {
        this.current.node = null
        this.current.distance = Infinity
        events.emit(EVENT.action.changed, false)
        this.clientActions.stop()
      } else {
        this.current.distance = distance
      }
    }

    let didChange
    this.cursor = BatchProcessor.processBatchWithCursor(this.nodes, this.cursor, BATCH_SIZE, (node) => {
      if (node.finished) return
      if (this.current.node === node) return
      const distance = node.worldPos.distanceTo(cameraPos)
      if (distance <= node._distance && distance < this.current.distance) {
        this.current.node = node
        this.current.distance = distance
        didChange = true
      }
    })
    if (didChange) {
      this.clientActions.startAction(this.current.node)
      events.emit(EVENT.action.changed, true)
    }
    return btnDown
  }

  release() {
    this.control?.release()
    this.control = null
    this.nodes = []
  }
}
