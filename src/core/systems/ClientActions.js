import { System } from './System.js'
import { ControlPriorities } from '../extras/ControlPriorities.js'
import { EVENT } from '../constants/EventNames.js'
import { ActionBoard } from './actions/ActionBoard.js'
import { ActionController } from './actions/ActionController.js'

const BATCH_SIZE = 500

export class ClientActions extends System {
  static DEPS = {
    rig: 'rig',
    events: 'events',
    controls: 'controls',
  }

  constructor(world) {
    super(world)
    this.nodes = []
    this.cursor = 0
    this.current = {
      node: null,
      distance: Infinity,
    }
    this.action = null
  }

  start() {
    const board = new ActionBoard(300, 44, 0.01, this.world)
    this.action = new ActionController(this.world, board)
    this.btnDown = false
    this.control = this.controls.bind({ priority: ControlPriorities.ACTION })
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
      this.action.stop()
    }
  }

  update(delta) {
    const cameraPos = this.rig.position

    this.btnDown =
      this.control.keyE.down ||
      this.control.touchB.down ||
      this.control.xrLeftTrigger.down ||
      this.control.xrRightTrigger.down

    if (this.current.node) {
      const distance = this.current.node.worldPos.distanceTo(cameraPos)
      if (distance > this.current.node._distance) {
        this.current.node = null
        this.current.distance = Infinity
        this.events.emit(EVENT.action.changed, false)
        this.action.stop()
      } else {
        this.current.distance = distance
      }
    }

    let didChange
    const size = Math.min(this.nodes.length, BATCH_SIZE)
    for (let i = 0; i < size; i++) {
      const idx = (this.cursor + i) % this.nodes.length
      const node = this.nodes[idx]
      if (node.finished) continue
      if (this.current.node === node) continue
      const distance = node.worldPos.distanceTo(cameraPos)
      if (distance <= node._distance && distance < this.current.distance) {
        this.current.node = node
        this.current.distance = distance
        didChange = true
      }
    }
    if (size) {
      this.cursor = (this.cursor + size) % this.nodes.length
    }
    if (didChange) {
      this.action.start(this.current.node)
      this.events.emit(EVENT.action.changed, true)
    }
    this.action.update(delta)
  }

  destroy() {
    this.control.release()
    this.control = null
    this.nodes = []
  }
}
