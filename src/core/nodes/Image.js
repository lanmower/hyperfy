import { Node } from './Node.js'
import { defineProps, createPropertyProxy } from '../utils/helpers/defineProperty.js'
import { createImageSchema } from '../utils/validation/createNodeSchema.js'
import { ImageRenderer } from './image/ImageRenderer.js'

const propertySchema = createImageSchema()

export class Image extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'image'
    defineProps(this, propertySchema, defaults, data)
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
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy())
    }
    return this.proxy
  }
}
