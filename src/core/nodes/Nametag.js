import { isNumber, isString } from 'lodash-es'
import { Node } from './Node.js'
import { defineProps, validators } from '../utils/defineProperty.js'

const defaults = {
  label: '...',
  health: 100,
}

const propertySchema = {
  health: {
    default: defaults.health,
    validate: validators.number,
    onSet(value) {
      this.handle?.setHealth(value)
    }
  },
}

export class Nametag extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'nametag'

    defineProps(this, propertySchema, defaults)

    this._label = defaults.label
    if (data.label !== undefined) {
      this.label = data.label
    }
    this.health = data.health
  }

  get label() {
    return this._label
  }

  set label(value = defaults.label) {
    if (isNumber(value)) value = String(value)
    if (!isString(value)) throw new Error('[nametag] label invalid')
    if (this._label === value) return
    this._label = value
    this.handle?.setName(value)
  }

  mount() {
    if (this.ctx.world.nametags) {
      this.handle = this.ctx.world.nametags.add({ name: this._label, health: this._health })
      this.handle?.move(this.matrixWorld)
    }
  }

  commit(didMove) {
    if (didMove) {
      this.handle?.move(this.matrixWorld)
    }
  }

  unmount() {
    this.handle?.destroy()
    this.handle = null
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    this.label = source.label
    for (const key in propertySchema) {
      this[key] = source[key]
    }
    return this
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
        get health() {
          return self.health
        },
        set health(value) {
          self.health = value
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
    }
    return this.proxy
  }
}
