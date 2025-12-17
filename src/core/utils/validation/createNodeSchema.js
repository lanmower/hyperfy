
import { Props, propSchema } from '../../Props.js'
import { validators, onSetRebuild, onSetRebuildIf } from '../helpers/defineProperty.js'

export class SchemaBuilder {
  constructor(propKeys = []) {
    this.props = propSchema(propKeys)
    this.overrides = {}
  }

  override(key, { default: def, validate, onSet }) {
    this.overrides[key] = {}
    if (def !== undefined) this.overrides[key].default = def
    if (validate) this.overrides[key].validate = validate
    if (onSet) this.overrides[key].onSet = onSet
    return this
  }

  overrideAll(overridesMap) {
    for (const [key, config] of Object.entries(overridesMap)) {
      this.override(key, config)
    }
    return this
  }

  add(key, { default: def, validate, onSet }) {
    if (!this.props[key]) {
      this.props[key] = {}
    }
    if (def !== undefined) this.props[key].default = def
    if (validate) this.props[key].validate = validate
    if (onSet) this.props[key].onSet = onSet
    return this
  }

  withRebuild() {
    for (const key of Object.keys(this.props)) {
      if (!this.overrides[key]?.onSet) {
        this.override(key, { onSet: onSetRebuild() })
      }
    }
    return this
  }

  build() {
    const schema = {}
    for (const [key, base] of Object.entries(this.props)) {
      schema[key] = { ...base, ...this.overrides[key] }
    }
    return schema
  }
}

export function schema(...propKeys) {
  return new SchemaBuilder(propKeys)
}


export function createMeshSchema(overrides = {}) {
  return schema('type', 'width', 'height', 'depth', 'radius', 'castShadow', 'receiveShadow', 'visible', 'color')
    .overrideAll({
      type: { validate: (v) => !['box', 'sphere', 'geometry'].includes(v) ? 'Invalid' : null, onSet: onSetRebuild() },
      width: { onSet: onSetRebuildIf(function() { return this._type === 'box' }) },
      height: { onSet: onSetRebuildIf(function() { return this._type === 'box' }) },
      depth: { onSet: onSetRebuildIf(function() { return this._type === 'box' }) },
      radius: { onSet: onSetRebuildIf(function() { return this._type === 'sphere' }) },
    })
    .build()
}

export function createImageSchema(overrides = {}) {
  return schema('src', 'width', 'height', 'fit', 'color', 'pivot', 'castShadow', 'receiveShadow', 'visible')
    .withRebuild()
    .overrideAll(overrides)
    .build()
}

export function createAudioSchema(overrides = {}) {
  return schema('src', 'volume', 'loop', 'group', 'spatial', 'distanceModel', 'refDistance', 'maxDistance', 'rolloffFactor')
    .overrideAll(overrides)
    .build()
}

export function createUISchema(overrides = {}) {
  return schema('display', 'flexDirection', 'justifyContent', 'alignItems', 'gap', 'backgroundColor', 'borderWidth', 'borderColor', 'borderRadius', 'padding')
    .overrideAll(overrides)
    .build()
}

export function createPhysicsSchema(overrides = {}) {
  return schema('mass', 'damping', 'angularDamping', 'friction', 'restitution', 'tag', 'trigger', 'convex')
    .overrideAll(overrides)
    .build()
}

export function createParticleSchema(overrides = {}) {
  return schema('emitting', 'shape', 'direction', 'rate', 'duration', 'max', 'velocityLinear', 'velocityOrbital', 'colorOverLife', 'alphaOverLife')
    .overrideAll(overrides)
    .build()
}
