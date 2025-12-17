import * as THREE from '../extras/three.js'
import { isFunction, isNumber, isString } from 'lodash-es'
import { defineProps, createPropertyProxy, validators } from '../../utils/helpers/defineProperty.js'
import { schema } from '../../utils/validation/createNodeSchema.js'
import { Node } from './Node.js'

const propertySchema = schema('label', 'distance', 'duration', 'onStart', 'onTrigger', 'onCancel')
  .overrideAll({
    label: { default: 'Interact', onSet: function() { this._label = isString(this._label) ? this._label : isNumber(this._label) ? this._label + '' : 'Interact' } },
    distance: { default: 3 },
    duration: { default: 0.5 },
    onStart: { default: () => {} },
    onTrigger: { default: () => {} },
    onCancel: { default: () => {} },
  })
  .build()

export class Action extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'action'
    defineProps(this, propertySchema, data)

    this.worldPos = new THREE.Vector3()
    this.progress = 0
  }

  mount() {
    this.ctx.world.actions?.register(this)
    this.worldPos.setFromMatrixPosition(this.matrixWorld)
  }

  commit(didMove) {
    if (didMove) {
      this.worldPos.setFromMatrixPosition(this.matrixWorld)
    }
  }

  unmount() {
    this.ctx.world.actions?.unregister(this)
  }

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy())
    }
    return this.proxy
  }
}
