import { isBoolean, isNumber, isString, isArray } from '../../utils/helpers/typeChecks.js'
import { defaults, defaultSizes, types } from './PrimDefaults.js'

export const PROPERTY_SCHEMA = {
  type: {
    validate: (v) => isString(v) && types.includes(v),
    error: '[prim] type invalid',
    needsRebuild: true,
  },
  size: {
    validate: (v, self) => {
      if (v === null || v === undefined) return true
      return isArray(v)
    },
    normalize: (v, self) => {
      if (v === null || v === undefined) return defaultSizes[self._type].slice()
      return v
    },
    error: '[prim] size must be an array',
    needsRebuild: true,
  },
  color: {
    validate: (v) => isString(v),
    error: '[prim] color must be string',
    handle: 'setColor',
  },
  emissive: {
    validate: (v) => v === null || isString(v),
    error: '[prim] emissive must be string or null',
    handle: 'setEmissive',
  },
  castShadow: {
    validate: (v) => isBoolean(v),
    error: '[prim] castShadow not a boolean',
    needsRebuild: true,
  },
  receiveShadow: {
    validate: (v) => isBoolean(v),
    error: '[prim] receiveShadow not a boolean',
    needsRebuild: true,
  },
  emissiveIntensity: {
    validate: (v) => isNumber(v) && v >= 0,
    error: '[prim] emissiveIntensity must be positive number',
    handle: 'setEmissiveIntensity',
  },
  metalness: {
    validate: (v) => isNumber(v) && v >= 0 && v <= 1,
    error: '[prim] metalness must be number between 0 and 1',
    needsRebuild: true,
  },
  roughness: {
    validate: (v) => isNumber(v) && v >= 0 && v <= 1,
    error: '[prim] roughness must be number between 0 and 1',
    needsRebuild: true,
  },
  opacity: {
    validate: (v) => isNumber(v) && v >= 0 && v <= 1,
    error: '[prim] opacity must be number between 0 and 1',
    needsRebuild: true,
  },
  texture: {
    validate: (v) => v === null || isString(v),
    error: '[prim] texture must be string or null',
    needsRebuild: true,
  },
  physics: {
    validate: (v) => v === null || ['static', 'kinematic', 'dynamic'].includes(v),
    error: '[prim] physics must be null, "static", "kinematic", or "dynamic"',
    needsRebuild: true,
  },
  mass: {
    validate: (v) => isNumber(v) && v > 0,
    error: '[prim] mass must be positive number',
    needsRebuild: true,
  },
  linearDamping: {
    validate: (v) => isNumber(v) && v >= 0,
    error: '[prim] linearDamping must be non-negative number',
    needsRebuild: true,
  },
  angularDamping: {
    validate: (v) => isNumber(v) && v >= 0,
    error: '[prim] angularDamping must be non-negative number',
    needsRebuild: true,
  },
  staticFriction: {
    validate: (v) => isNumber(v) && v >= 0 && v <= 1,
    error: '[prim] staticFriction must be number between 0 and 1',
    needsRebuild: true,
  },
  dynamicFriction: {
    validate: (v) => isNumber(v) && v >= 0 && v <= 1,
    error: '[prim] dynamicFriction must be number between 0 and 1',
    needsRebuild: true,
  },
  restitution: {
    validate: (v) => isNumber(v) && v >= 0 && v <= 1,
    error: '[prim] restitution must be number between 0 and 1',
    needsRebuild: true,
  },
  layer: {
    validate: (v) => isString(v),
    error: '[prim] layer must be string',
    needsRebuild: true,
  },
  trigger: {
    validate: (v) => isBoolean(v),
    error: '[prim] trigger must be boolean',
    needsRebuild: true,
  },
  tag: {
    validate: (v) => v === null || isString(v),
    error: '[prim] tag must be string or null',
  },
  onContactStart: {
    validate: (v) => v === null || typeof v === 'function',
    error: '[prim] onContactStart must be function or null',
  },
  onContactEnd: {
    validate: (v) => v === null || typeof v === 'function',
    error: '[prim] onContactEnd must be function or null',
  },
  onTriggerEnter: {
    validate: (v) => v === null || typeof v === 'function',
    error: '[prim] onTriggerEnter must be function or null',
  },
  onTriggerLeave: {
    validate: (v) => v === null || typeof v === 'function',
    error: '[prim] onTriggerLeave must be function or null',
  },
  doubleside: {
    validate: (v) => isBoolean(v),
    error: '[prim] doubleside must be boolean',
    needsRebuild: true,
  },
}
