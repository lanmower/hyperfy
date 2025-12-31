import { Node } from './Node.js'
import { initializeNode } from './base/NodeConstructorHelper.js'
import { createSchemaProxy } from '../utils/helpers/NodeSchemaHelper.js'
import * as THREE from '../extras/three.js'
import { schema } from '../utils/validation/index.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('Sky')

const rebuild = () => function() { this.markRebuild(); this.setDirty() }
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
    initializeNode(this, 'sky', propertySchema, {}, data)
  }

  mount() {
    logger.info('Sky mount started', { hasCtx: !!this.ctx, hasWorld: !!this.ctx?.world })
    this.handle = this.ctx.world.environment.addSky?.(this)
    logger.info('Sky mount completed', { handleSet: !!this.handle })
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
    return createSchemaProxy(this, propertySchema)
  }
}
