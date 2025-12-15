/**
 * AppValidator.js
 *
 * Reusable app validation utilities.
 * Uses centralized AppBlueprint schema for validation.
 */

import { validateBlueprint, normalizeBlueprint, isListableApp } from '../schemas/AppBlueprint.schema.js'

export class AppValidator {
  /**
   * Validate blueprint structure
   */
  static validateBlueprint(blueprint) {
    return validateBlueprint(blueprint)
  }

  /**
   * Normalize blueprint with defaults
   */
  static normalizeBlueprint(blueprint) {
    return normalizeBlueprint(blueprint)
  }

  /**
   * Validate app entity structure and blueprint reference
   */
  static validateAppEntity(entity, blueprintMap) {
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

  /**
   * Check if an app would appear in the client's app list
   */
  static isAppListable(app, blueprintMap) {
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

  /**
   * Filter apps to only those that would appear in client list
   */
  static filterListableApps(apps, blueprintMap) {
    if (!Array.isArray(apps)) {
      return []
    }

    return apps.filter(app => {
      try {
        return this.isAppListable(app, blueprintMap)
      } catch (err) {
        console.warn(`App ${app?.id} failed listability check:`, err.message)
        return false
      }
    })
  }

  /**
   * Get validation errors for debugging
   */
  static getValidationErrors(blueprint) {
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
