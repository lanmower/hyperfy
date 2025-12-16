import * as THREE from '../extras/three.js'
import { isFunction, isNumber, isString } from 'lodash-es'
import { defineProps, createPropertyProxy, validators } from '../utils/defineProperty.js'
import { Node } from './Node.js'

const propertySchema = {
  label: {
    default: 'Interact',
    validate: v => {
      if (isString(v) || isNumber(v)) return null
      return '[action] label not a string or number'
    },
    onSet(value) {
      this._label = isString(value) ? value : isNumber(value) ? value + '' : 'Interact'
    },
  },
  distance: {
    default: 3,
    validate: validators.number,
  },
  duration: {
    default: 0.5,
    validate: validators.number,
  },
  onStart: {
    default: () => {},
    validate: validators.func,
  },
  onTrigger: {
    default: () => {},
    validate: validators.func,
  },
  onCancel: {
    default: () => {},
    validate: validators.func,
  },
}

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
