/**
 * AppBuilder - Creates and manages apps in the world
 *
 * Provides a fluent API for:
 * - Creating apps from blueprints
 * - Adding new blueprints
 * - Listing apps that would appear in client UI
 * - Validating app structure
 *
 * All operations enforce the same requirements as the Hyperfy client.
 */

import { AppValidator } from '../utils/AppValidator.js'

export class AppBuilder {
  constructor(client) {
    this.client = client
  }

  /**
   * Create a new app instance in the world
   *
   * Validates blueprint exists and has required fields before creating entity.
   *
   * @param {string} blueprintId - ID of blueprint to use
   * @param {Array} position - [x, y, z] position (default [0, 0, 0])
   * @param {Array} quaternion - [x, y, z, w] rotation (default [0, 0, 0, 1])
   * @param {Object} options - Additional options
   * @param {boolean} options.pinned - Whether app is pinned (immutable)
   * @param {Object} options.state - Initial entity state
   * @returns {Promise} Server response from entityAdded packet
   * @throws {Error} If blueprint not found or validation fails
   */
  createApp(blueprintId, position = [0, 0, 0], quaternion = [0, 0, 0, 1], options = {}) {
    // Validate blueprint exists
    const blueprint = this.client.getBlueprint(blueprintId)
    if (!blueprint) {
      throw new Error(`Cannot create app: blueprint '${blueprintId}' not found`)
    }

    // Validate blueprint structure
    const validation = AppValidator.validateBlueprint(blueprint)
    if (!validation.valid) {
      throw new Error(`Cannot create app: blueprint validation failed - ${validation.error}`)
    }

    // Validate position and rotation
    if (!Array.isArray(position) || position.length !== 3) {
      throw new Error('Position must be array [x, y, z]')
    }

    if (!Array.isArray(quaternion) || quaternion.length !== 4) {
      throw new Error('Quaternion must be array [x, y, z, w]')
    }

    // Build entity data matching client format
    const entityData = {
      id: this.generateId(),
      type: 'app',
      blueprint: blueprintId,
      position: position,
      quaternion: quaternion,
      scale: [1, 1, 1],
      mover: null,
      uploader: null,
      pinned: options.pinned || false,
      state: options.state || {}
    }

    // Send to server
    return this.client.send('entityAdded', entityData)
  }

  /**
   * Add a new blueprint to the world
   *
   * Validates blueprint structure before sending to server.
   *
   * @param {Object} blueprint - Blueprint definition
   * @param {string} blueprint.id - Unique identifier
   * @param {string} blueprint.name - Display name
   * @param {string} blueprint.model - 3D model URL (required)
   * @param {Object} blueprint.props - Configuration object
   * @param {string} blueprint.author - Creator name
   * @param {string} blueprint.desc - Description
   * @param {string} blueprint.image - Thumbnail URL
   * @param {string} blueprint.script - App script URL
   * @param {number} blueprint.version - Version number
   * @param {boolean} blueprint.public - Public/private flag
   * @param {boolean} blueprint.locked - Editor lock flag
   * @param {boolean} blueprint.frozen - Physics freeze flag
   * @param {boolean} blueprint.unique - Single instance flag
   * @param {boolean} blueprint.scene - Scene replacement flag
   * @param {boolean} blueprint.disabled - Hidden from UI flag
   * @param {boolean} blueprint.preload - Preload hint flag
   * @returns {Promise} Server response from blueprintAdded packet
   * @throws {Error} If validation fails
   */
  addBlueprint(blueprint) {
    // Validate blueprint structure
    const validation = AppValidator.validateBlueprint(blueprint)
    if (!validation.valid) {
      throw new Error(`Blueprint validation failed: ${validation.error}`)
    }

    // Ensure version is set
    if (blueprint.version === undefined) {
      blueprint.version = 0
    }

    // Send to server
    return this.client.send('blueprintAdded', blueprint)
  }

  /**
   * Modify an existing blueprint
   *
   * Updates blueprint fields on server.
   *
   * @param {string} blueprintId - ID of blueprint to modify
   * @param {Object} changes - Fields to update
   * @param {string} changes.name - New name
   * @param {string} changes.desc - New description
   * @param {string} changes.image - New thumbnail URL
   * @param {Object} changes.props - New props object
   * @param {boolean} changes.disabled - Hide from UI
   * @returns {Promise} Server response from blueprintModified packet
   * @throws {Error} If blueprint not found
   */
  modifyBlueprint(blueprintId, changes) {
    const blueprint = this.client.getBlueprint(blueprintId)
    if (!blueprint) {
      throw new Error(`Cannot modify blueprint: '${blueprintId}' not found`)
    }

    // Build change object with incremented version
    const changeData = {
      id: blueprintId,
      version: (blueprint.version || 0) + 1,
      ...changes
    }

    return this.client.send('blueprintModified', changeData)
  }

  /**
   * Get all apps that would appear in the client's app list
   *
   * Filters apps by:
   * - Blueprint exists
   * - Blueprint has model
   * - Blueprint not disabled
   * - Blueprint is not scene app
   *
   * @returns {App[]} Array of listable app entities
   */
  getListableApps() {
    const apps = this.client.getApps()
    return AppValidator.filterListableApps(apps, this.client.blueprints)
  }

  /**
   * Check if a specific app would appear in client list
   * @param {App} app - App to check
   * @returns {boolean}
   */
  isAppListable(app) {
    return AppValidator.isAppListable(app, this.client.blueprints)
  }

  /**
   * Get all blueprints
   * @returns {Object[]} Array of all blueprints
   */
  getBlueprints() {
    return this.client.getBlueprints()
  }

  /**
   * Get blueprint by ID
   * @param {string} id - Blueprint ID
   * @returns {Object|null} Blueprint or null if not found
   */
  getBlueprint(id) {
    return this.client.getBlueprint(id)
  }

  /**
   * Validate a blueprint without adding it
   * @param {Object} blueprint - Blueprint to validate
   * @returns {Object} { valid: boolean, error?: string }
   */
  validateBlueprint(blueprint) {
    return AppValidator.validateBlueprint(blueprint)
  }

  /**
   * Validate an app entity
   * @param {App} entity - App entity to validate
   * @returns {Object} { valid: boolean, error?: string }
   */
  validateAppEntity(entity) {
    return AppValidator.validateAppEntity(entity, this.client.blueprints)
  }

  /**
   * Get debug information about apps
   * @returns {Object} Debug info including counts and validation status
   */
  getDebugInfo() {
    const allApps = this.client.getApps()
    const listable = this.getListableApps()
    const blueprints = this.getBlueprints()

    const invalidApps = allApps.filter(app => !this.isAppListable(app))

    return {
      totalApps: allApps.length,
      listableApps: listable.length,
      invalidApps: invalidApps.length,
      totalBlueprints: blueprints.length,
      invalidDetails: invalidApps.map(app => {
        const bp = this.client.getBlueprint(app.blueprintId)
        const reasons = []

        if (!bp) reasons.push('Blueprint not found')
        if (bp && !bp.model) reasons.push('Missing model')
        if (bp && bp.disabled) reasons.push('Disabled')
        if (bp && bp.scene) reasons.push('Scene app')

        return {
          appId: app.id,
          blueprintId: app.blueprintId,
          reasons: reasons.join(', ')
        }
      })
    }
  }

  /**
   * Generate unique ID for entities
   * @private
   * @returns {string}
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}
