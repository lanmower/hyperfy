/**
 * AppValidator - Validates app blueprints and entities
 *
 * Ensures SDK apps match client requirements:
 * - Blueprint must have required fields (id, model)
 * - Entity must reference valid blueprint
 * - Only listable apps appear in getListableApps()
 */

export class AppValidator {
  /**
   * Validate blueprint structure
   * @param {Object} blueprint - Blueprint object to validate
   * @returns {Object} { valid: boolean, error?: string }
   */
  static validateBlueprint(blueprint) {
    if (!blueprint) {
      return { valid: false, error: 'Blueprint is null or undefined' }
    }

    if (typeof blueprint !== 'object') {
      return { valid: false, error: 'Blueprint must be an object' }
    }

    // Required fields
    if (!blueprint.id) {
      return { valid: false, error: 'Blueprint missing required field: id' }
    }

    if (typeof blueprint.id !== 'string') {
      return { valid: false, error: 'Blueprint id must be a string' }
    }

    // Model is required for listable apps
    if (!blueprint.model) {
      return { valid: false, error: 'Blueprint missing required field: model' }
    }

    if (typeof blueprint.model !== 'string') {
      return { valid: false, error: 'Blueprint model must be a string (URL path)' }
    }

    // Name should be present
    if (!blueprint.name) {
      return { valid: false, error: 'Blueprint missing recommended field: name' }
    }

    // Validate props is object if present
    if (blueprint.props && typeof blueprint.props !== 'object') {
      return { valid: false, error: 'Blueprint props must be an object' }
    }

    // Validate boolean flags
    const booleanFields = ['preload', 'public', 'locked', 'frozen', 'unique', 'scene', 'disabled']
    for (const field of booleanFields) {
      if (blueprint[field] !== undefined && typeof blueprint[field] !== 'boolean') {
        return { valid: false, error: `Blueprint ${field} must be boolean` }
      }
    }

    // Validate string fields
    const stringFields = ['version', 'author', 'url', 'desc', 'image', 'script']
    for (const field of stringFields) {
      if (blueprint[field] !== undefined && typeof blueprint[field] !== 'string') {
        return { valid: false, error: `Blueprint ${field} must be string` }
      }
    }

    return { valid: true }
  }

  /**
   * Validate app entity structure and blueprint reference
   * @param {Entity} entity - Entity to validate
   * @param {Map} blueprintMap - Map of blueprints
   * @returns {Object} { valid: boolean, error?: string }
   */
  static validateAppEntity(entity, blueprintMap) {
    if (!entity) {
      return { valid: false, error: 'Entity is null or undefined' }
    }

    // Check entity type
    if (!entity.type || entity.type !== 'app') {
      return { valid: false, error: `Entity type must be 'app', got '${entity.type}'` }
    }

    // Check entity has blueprint ID
    if (!entity.blueprintId && !entity.blueprint) {
      return { valid: false, error: 'App entity missing blueprint ID' }
    }

    const blueprintId = entity.blueprintId || entity.blueprint
    if (typeof blueprintId !== 'string') {
      return { valid: false, error: 'Blueprint ID must be a string' }
    }

    // Check blueprint exists
    const blueprint = blueprintMap.get(blueprintId)
    if (!blueprint) {
      return { valid: false, error: `Blueprint '${blueprintId}' does not exist` }
    }

    // Validate the blueprint itself
    return this.validateBlueprint(blueprint)
  }

  /**
   * Check if an app would appear in the client's app list
   *
   * Client filters:
   * - Must be app entity
   * - Blueprint must exist
   * - Blueprint must have model
   * - Blueprint must not be disabled
   * - Blueprint must not be scene app
   *
   * @param {App} app - App entity to check
   * @param {Map} blueprintMap - Map of blueprints
   * @returns {boolean}
   */
  static isAppListable(app, blueprintMap) {
    // Entity must be app type
    if (!app || app.type !== 'app') {
      return false
    }

    // Must have blueprint ID
    const blueprintId = app.blueprintId || app.blueprint
    if (!blueprintId) {
      return false
    }

    // Blueprint must exist
    const blueprint = blueprintMap.get(blueprintId)
    if (!blueprint) {
      return false
    }

    // Blueprint must have model (prevents corrupt apps)
    if (!blueprint.model) {
      return false
    }

    // Blueprint must not be disabled
    if (blueprint.disabled) {
      return false
    }

    // Blueprint must not be scene app (scene apps use different UI)
    if (blueprint.scene) {
      return false
    }

    return true
  }

  /**
   * Filter apps to only those that would appear in client list
   * @param {App[]} apps - Array of app entities
   * @param {Map} blueprintMap - Map of blueprints
   * @returns {App[]} Filtered array of listable apps
   */
  static filterListableApps(apps, blueprintMap) {
    if (!Array.isArray(apps)) {
      return []
    }

    return apps.filter(app => {
      try {
        return this.isAppListable(app, blueprintMap)
      } catch (err) {
        // Silently filter out apps that cause validation errors
        console.warn(`App ${app?.id} failed listability check:`, err.message)
        return false
      }
    })
  }

  /**
   * Get validation errors for debugging
   * @param {Object} blueprint - Blueprint to validate
   * @returns {string[]} Array of error messages (empty if valid)
   */
  static getValidationErrors(blueprint) {
    const errors = []

    if (!blueprint) {
      errors.push('Blueprint is null or undefined')
      return errors
    }

    if (!blueprint.id) {
      errors.push('Missing id field')
    }

    if (!blueprint.model) {
      errors.push('Missing model field')
    }

    if (!blueprint.name) {
      errors.push('Missing name field')
    }

    if (blueprint.props && typeof blueprint.props !== 'object') {
      errors.push('props must be an object')
    }

    const booleanFields = ['preload', 'public', 'locked', 'frozen', 'unique', 'scene', 'disabled']
    for (const field of booleanFields) {
      if (blueprint[field] !== undefined && typeof blueprint[field] !== 'boolean') {
        errors.push(`${field} must be boolean`)
      }
    }

    return errors
  }
}
