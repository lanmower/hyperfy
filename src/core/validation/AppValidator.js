import { BaseValidator } from './BaseValidator.js'
import { validateBlueprint, normalizeBlueprint, isListableApp } from '../schemas/AppBlueprint.schema.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('AppValidator')

export class AppValidator extends BaseValidator {
  constructor() {
    super('AppValidator')
  }

  validateBlueprint(blueprint) {
    return validateBlueprint(blueprint)
  }

  normalizeBlueprint(blueprint) {
    return normalizeBlueprint(blueprint)
  }

  validateAppEntity(entity, blueprintMap) {
    if (!entity) {
      return { valid: false, error: 'Entity is null or undefined' }
    }

    if (!entity.type || entity.type !== 'app') {
      return { valid: false, error: `Entity type must be 'app', got '${entity.type}'` }
    }

    if (!entity.blueprintId && !entity.blueprint) {
      return { valid: false, error: 'App entity missing blueprint ID' }
    }

    const blueprintId = entity.blueprintId || entity.blueprint
    if (typeof blueprintId !== 'string') {
      return { valid: false, error: 'Blueprint ID must be a string' }
    }

    const blueprint = blueprintMap.get(blueprintId)
    if (!blueprint) {
      return { valid: false, error: `Blueprint '${blueprintId}' does not exist` }
    }

    return this.validateBlueprint(blueprint)
  }

  isAppListable(app, blueprintMap) {
    if (!app || app.type !== 'app') {
      return false
    }

    const blueprintId = app.blueprintId || app.blueprint
    if (!blueprintId) {
      return false
    }

    const blueprint = blueprintMap.get(blueprintId)
    if (!blueprint) {
      return false
    }

    return isListableApp(blueprint)
  }

  filterListableApps(apps, blueprintMap) {
    if (!Array.isArray(apps)) {
      return []
    }

    return apps.filter(app => {
      try {
        return this.isAppListable(app, blueprintMap)
      } catch (err) {
        logger.warn('App failed listability check', { appId: app?.id, error: err.message })
        return false
      }
    })
  }

  getValidationErrors(blueprint) {
    const errors = []

    if (!blueprint) {
      errors.push('Blueprint is null or undefined')
      return errors
    }

    const result = this.validateBlueprint(blueprint)
    if (!result.valid) {
      errors.push(result.error)
    }

    return errors
  }
}
