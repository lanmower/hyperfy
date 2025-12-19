import { System } from './System.js'
import { BatchProcessor } from '../utils.js'
import { RenderConfig } from '../config/SystemConfig.js'

const BATCH_SIZE = RenderConfig.LOD_BATCH_SIZE

export class LODs extends System {
  constructor(world) {
    super(world)
    this.nodes = []
    this.cursor = 0
  }

  register(node) {
    this.nodes.push(node)
  }

  unregister(node) {
    const idx = this.nodes.indexOf(node)
    if (idx === -1) return
    this.nodes.splice(idx, 1)
  }

  update(delta) {
    this.cursor = BatchProcessor.processBatchWithCursor(this.nodes, this.cursor, BATCH_SIZE, (node) => {
      node.check()
    })
  }

  destroy() {
    this.nodes = []
  }
}
