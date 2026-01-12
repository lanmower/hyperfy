import { Node } from './Node.js'
import { initializeNode } from './base/NodeConstructorHelper.js'
import { createSchemaProxy } from '../utils/helpers/NodeSchemaHelper.js'
import { createImageSchema } from '../utils/validation/index.js'
import { ImageRenderer } from './image/ImageRenderer.js'
import { StateInitializer } from './base/StateInitializer.js'

const propertySchema = createImageSchema()

export class Image extends Node {
  constructor(data = {}) {
    super(data)
    initializeNode(this, 'image', propertySchema, {}, data)
    StateInitializer.mergeState(this, StateInitializer.initRenderingState())
    this.renderer = new ImageRenderer(this)
  }

  async mount() {
    this.renderer.build()
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.renderer.build()
      return
    }
    if (didMove) {
      if (this.mesh) {
        this.mesh.matrixWorld.copy(this.matrixWorld)
      }
    }
  }

  unmount() {
    this.renderer.unbuild()
  }

  getProxy() {
    return createSchemaProxy(this, propertySchema)
  }
}
