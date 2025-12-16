import { isNumber, isString } from 'lodash-es'
import { Node } from './Node.js'
import { defineProps, validators, createPropertyProxy } from '../utils/defineProperty.js'
import { schema } from '../utils/createNodeSchema.js'

const defaults = {
  label: '...',
  health: 100,
}

const propertySchema = schema('health')
  .overrideAll({
    health: { default: defaults.health, onSet: function() { this.handle?.setHealth(this._health) } },
  })
  .build()

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
    if (!this.proxy) {
      const self = this
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy(),
        {},
        {
          label: {
            get() { return self.label },
            set(value) { self.label = value }
          },
        }
      )
    }
    return this.proxy
  }
}
