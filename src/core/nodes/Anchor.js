import { Node } from './Node.js'
import { createPropertyProxy } from '../../utils/helpers/defineProperty.js'

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
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, {}, super.getProxy(), {}, { anchorId: function() { return this.anchorId } })
    }
    return this.proxy
  }
}
