import { Node } from './Node.js'
import { createSchemaProxy } from '../utils/helpers/NodeSchemaHelper.js'

export class Anchor extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'anchor'
  }

  mount() {
    this.anchorId = `${this.ctx?.entity?.data.id || ''}:${this.id}`
    this.ctx.world.anchors.add(this.anchorId, this.matrixWorld)
  }

  unmount() {
    this.ctx.world.anchors.remove(this.anchorId)
  }

  getProxy() {
    return createSchemaProxy(this, {}, {}, { anchorId: function() { return this.anchorId } })
  }
}
