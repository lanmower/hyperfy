import { Node } from './Node.js'
import { defineProps, createPropertyProxy } from '../utils/helpers/defineProperty.js'
import * as THREE from '../extras/three.js'
import { schema } from '../utils/validation/createNodeSchema.js'

const rebuild = () => function() { this.needsRebuild = true; this.setDirty() }
const propertySchema = schema('bg', 'hdr', 'rotationY', 'sunDirection', 'sunIntensity', 'fogNear', 'fogFar', 'fogColor')
  .add('sunColor', { default: null, onSet: rebuild() })
  .overrideAll({
    bg: { default: null, onSet: rebuild() },
    hdr: { default: null, onSet: rebuild() },
    rotationY: { default: null, onSet: rebuild() },
    sunDirection: { default: null, onSet: rebuild() },
    sunIntensity: { default: null, onSet: rebuild() },
    fogNear: { default: null, onSet: rebuild() },
    fogFar: { default: null, onSet: rebuild() },
    fogColor: { default: null, onSet: rebuild() },
  })
  .build()

export class Sky extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'sky'
    defineProps(this, propertySchema, data)
  }

  mount() {
    this.handle = this.ctx.world.environment.addSky?.(this)
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.handle?.destroy()
      this.handle = this.ctx.world.environment.addSky?.(this)
      this.needsRebuild = false
    }
  }

  unmount() {
    this.handle?.destroy()
  }

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy())
    }
    return this.proxy
  }
}
