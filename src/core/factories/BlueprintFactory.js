// Blueprint factory with validation and defaults
import { uuid } from '../utils.js'
import { BaseFactory } from '../patterns/BaseFactory.js'
import { AppValidator } from '../validation/AppValidator.js'

const appValidator = new AppValidator()

const DEFAULT_BLUEPRINT = {
  id: null,
  version: '0',
  name: '',
  image: null,
  author: null,
  url: null,
  desc: null,
  model: null,
  script: null,
  props: {},
  preload: false,
  public: false,
  locked: false,
  frozen: false,
  unique: false,
  scene: false,
  disabled: false,
}

const TYPE_DEFAULTS = {
  app: { ...DEFAULT_BLUEPRINT },
  scene: { ...DEFAULT_BLUEPRINT, scene: true },
  model: { ...DEFAULT_BLUEPRINT, model: 'asset://model.glb' },
  avatar: { ...DEFAULT_BLUEPRINT, model: 'asset://avatar.vrm' },
}

export class BlueprintFactory extends BaseFactory {
  static create(config = {}) {
    const { type = 'app', ...data } = config
    const defaults = TYPE_DEFAULTS[type] || TYPE_DEFAULTS.app
    const blueprint = { ...defaults, ...data }

    if (!blueprint.id) {
      blueprint.id = uuid()
    }

    if (blueprint.version !== undefined && typeof blueprint.version !== 'string') {
      blueprint.version = String(blueprint.version)
    }

    this.validate(blueprint)
    return blueprint
  }

  static validate(blueprint) {
    if (!blueprint) {
      throw new Error('Blueprint is null or undefined')
    }

    if (typeof blueprint !== 'object') {
      throw new Error('Blueprint must be an object')
    }

    if (!blueprint.id || typeof blueprint.id !== 'string') {
      throw new Error('Blueprint must have a valid id (string)')
    }

    if (blueprint.version === undefined || (typeof blueprint.version !== 'string' && typeof blueprint.version !== 'number')) {
      throw new Error('Blueprint must have a valid version (string or number)')
    }

    if (blueprint.name === undefined || typeof blueprint.name !== 'string') {
      throw new Error('Blueprint must have a valid name (string)')
    }

    const normalized = appValidator.normalizeBlueprint(blueprint)
    const validation = appValidator.validateBlueprint(normalized)
    if (!validation.valid) {
      throw new Error(`Blueprint validation failed: ${validation.error}`)
    }

    return blueprint
  }

  static createBlueprint(type = 'app', data = {}) {
    return this.create({ type, ...data })
  }

  static createDefault(type = 'app') {
    return this.create({ type })
  }

  static mergeBlueprintData(defaults = {}, overrides = {}) {
    const merged = { ...defaults, ...overrides }
    this.validate(merged)
    return merged
  }

  static formatBlueprint(blueprint) {
    const formatted = { ...blueprint }

    if (!formatted.id) {
      formatted.id = uuid()
    }

    if (formatted.version === undefined || formatted.version === null) {
      formatted.version = '0'
    } else if (typeof formatted.version !== 'string') {
      formatted.version = String(formatted.version)
    }

    if (!formatted.name || typeof formatted.name !== 'string') {
      formatted.name = ''
    }

    this.validate(formatted)
    return formatted
  }
}
