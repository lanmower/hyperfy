import * as THREE from '../extras/three.js'
import { isFunction, isNumber, isString } from 'lodash-es'
import { defineProps } from '../utils/defineProperty.js'
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
    validate: v => !isNumber(v) ? '[action] distance not a number' : null,
  },
  duration: {
    default: 0.5,
    validate: v => !isNumber(v) ? '[action] duration not a number' : null,
  },
  onStart: {
    default: () => {},
    validate: v => !isFunction(v) ? '[action] onStart not a function' : null,
  },
  onTrigger: {
    default: () => {},
    validate: v => !isFunction(v) ? '[action] onTrigger not a function' : null,
  },
  onCancel: {
    default: () => {},
    validate: v => !isFunction(v) ? '[action] onCancel not a function' : null,
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
    var self = this
    if (!this.proxy) {
      let proxy = {
        get label() {
          return self.label
        },
        set label(value) {
          self.label = value
        },
        get distance() {
          return self.distance
        },
        set distance(value) {
          self.distance = value
        },
        get duration() {
          return self.duration
        },
        set duration(value) {
          self.duration = value
        },
        get onStart() {
          return self.onStart
        },
        set onStart(value) {
          self.onStart = value
        },
        get onTrigger() {
          return self.onTrigger
        },
        set onTrigger(value) {
          self.onTrigger = value
        },
        get onCancel() {
          return self.onCancel
        },
        set onCancel(value) {
          self.onCancel = value
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
    }
    return this.proxy
  }
}
