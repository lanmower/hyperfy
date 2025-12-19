import { Node } from './Node.js'
import { defineProps } from '../utils/helpers/defineProperty.js'
import { createSchemaProxy } from '../utils/helpers/NodeSchemaHelper.js'
import { createImageSchema } from '../utils/validation/createNodeSchema.js'
import { ImageRenderer } from './image/ImageRenderer.js'

const propertySchema = createImageSchema()

export class Image extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'image'
    defineProps(this, propertySchema, data)
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
