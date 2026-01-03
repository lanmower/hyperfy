import { PrimCore } from './PrimCore.js'
import { defaults } from './PrimDefaults.js'
import { PrimPropertyValidator } from './PrimPropertyValidator.js'

export class Prim extends PrimCore {
  #createProperty(name, internalName) {
    Object.defineProperty(this, name, {
      get: () => this[internalName],
      set: (value = defaults[name]) => this.#setProperty(name, internalName, value),
      enumerable: true,
      configurable: true,
    })
  }

  #setProperty(name, internalName, value) {
    const { normalizedValue, defaultValue } = PrimPropertyValidator.validate(name, value, this)
    const finalValue = normalizedValue !== null && normalizedValue !== undefined ? normalizedValue : defaultValue

    if (PrimPropertyValidator.isEqual(this[internalName], finalValue, name)) {
      return
    }

    this[internalName] = finalValue

    const handleMethod = PrimPropertyValidator.getHandleMethod(name)
    if (handleMethod && this.handle?.[handleMethod]) {
      this.handle[handleMethod](finalValue)
    }

    if (PrimPropertyValidator.shouldRebuild(name)) {
      this.needsRebuild = true
      this.setDirty()
    }
  }

  constructor() {
    super()
    this._type = defaults.type
    this._size = defaults.size.slice()
    this._color = defaults.color
    this._emissive = defaults.emissive
    this._castShadow = defaults.castShadow
    this._receiveShadow = defaults.receiveShadow
    this._emissiveIntensity = defaults.emissiveIntensity
    this._metalness = defaults.metalness
    this._roughness = defaults.roughness
    this._opacity = defaults.opacity
    this._texture = defaults.texture
    this._physics = defaults.physics
    this._mass = defaults.mass
    this._linearDamping = defaults.linearDamping
    this._angularDamping = defaults.angularDamping
    this._staticFriction = defaults.staticFriction
    this._dynamicFriction = defaults.dynamicFriction
    this._restitution = defaults.restitution
    this._layer = defaults.layer
    this._trigger = defaults.trigger
    this._tag = defaults.tag
    this._onContactStart = defaults.onContactStart
    this._onContactEnd = defaults.onContactEnd
    this._onTriggerEnter = defaults.onTriggerEnter
    this._onTriggerLeave = defaults.onTriggerLeave
    this._doubleside = defaults.doubleside

    this.#createProperty('type', '_type')
    this.#createProperty('size', '_size')
    this.#createProperty('color', '_color')
    this.#createProperty('emissive', '_emissive')
    this.#createProperty('castShadow', '_castShadow')
    this.#createProperty('receiveShadow', '_receiveShadow')
    this.#createProperty('emissiveIntensity', '_emissiveIntensity')
    this.#createProperty('metalness', '_metalness')
    this.#createProperty('roughness', '_roughness')
    this.#createProperty('opacity', '_opacity')
    this.#createProperty('texture', '_texture')
    this.#createProperty('physics', '_physics')
    this.#createProperty('mass', '_mass')
    this.#createProperty('linearDamping', '_linearDamping')
    this.#createProperty('angularDamping', '_angularDamping')
    this.#createProperty('staticFriction', '_staticFriction')
    this.#createProperty('dynamicFriction', '_dynamicFriction')
    this.#createProperty('restitution', '_restitution')
    this.#createProperty('layer', '_layer')
    this.#createProperty('trigger', '_trigger')
    this.#createProperty('tag', '_tag')
    this.#createProperty('onContactStart', '_onContactStart')
    this.#createProperty('onContactEnd', '_onContactEnd')
    this.#createProperty('onTriggerEnter', '_onTriggerEnter')
    this.#createProperty('onTriggerLeave', '_onTriggerLeave')
    this.#createProperty('doubleside', '_doubleside')
  }
}
