import { RegistrySystemBase } from './RegistrySystemBase.js'
import { BatchProcessor } from '../utils.js'
import { RenderConfig } from '../config/SystemConfig.js'

const BATCH_SIZE = RenderConfig.LOD_BATCH_SIZE

export class LODs extends RegistrySystemBase {
  constructor(world) {
    super(world)
    this.cursor = 0
    this.nodeList = []
  }

  register(node) {
    super.register(`lod_${this.nodeList.length}`, node)
    this.nodeList.push(node)
  }

  unregister(node) {
    const idx = this.nodeList.indexOf(node)
    if (idx === -1) return
    this.nodeList.splice(idx, 1)
  }

  update(delta) {
    this.cursor = BatchProcessor.processBatchWithCursor(this.nodeList, this.cursor, BATCH_SIZE, (node) => {
      node.check()
    })
  }
}
