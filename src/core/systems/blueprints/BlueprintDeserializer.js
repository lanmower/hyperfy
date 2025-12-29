import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'
import { InputSanitizer } from '../../validators/InputSanitizer.js'
import { AppValidator } from '../../validators/AppValidator.js'

const logger = new ComponentLogger('BlueprintDeserializer')

export class BlueprintDeserializer {
  constructor(blueprintSystem) {
    this.blueprints = blueprintSystem
  }

  deserialize(blueprintDatas) {
    if (!Array.isArray(blueprintDatas)) {
      logger.error('Invalid blueprint data format', { type: typeof blueprintDatas })
      return []
    }

    const deserialized = []
    for (const data of blueprintDatas) {
      try {
        const result = this.deserializeOne(data)
        if (result) {
          deserialized.push(result)
        }
      } catch (error) {
        logger.error('Blueprint deserialization failed', {
          blueprintId: data?.id,
          error: error.message
        })
      }
    }

    return deserialized
  }

  deserializeOne(data) {
    if (!data) return null

    try {
      const validated = this.validate(data)
      const normalized = this.normalize(validated)
      this.store(normalized)
      return normalized
    } catch (error) {
      logger.error('Single blueprint deserialization failed', {
        blueprintId: data.id,
        error: error.message,
      })
      throw error
    }
  }

  validate(data) {
    if (!data.id || typeof data.id !== 'string') {
      throw new Error('Invalid blueprint ID')
    }

    const scriptErrors = InputSanitizer.validateScript(data.script)
    if (scriptErrors.length > 0) {
      throw new Error(`Script validation failed: ${scriptErrors[0]}`)
    }

    const propErrors = InputSanitizer.validateProperties(data.props)
    if (propErrors.length > 0) {
      throw new Error(`Properties validation failed: ${propErrors[0]}`)
    }

    const validation = AppValidator.validateBlueprint(data)
    if (!validation.valid) {
      throw new Error(`Schema validation failed: ${validation.errors[0]}`)
    }

    return data
  }

  normalize(data) {
    return AppValidator.normalizeBlueprint(data)
  }

  store(normalizedData) {
    if (!this.blueprints.items) {
      logger.error('Blueprint storage not initialized')
      return false
    }

    this.blueprints.items.set(normalizedData.id, normalizedData)
    return true
  }

  clear() {
    this.blueprints.items.clear()
  }

  getBlueprint(id) {
    return this.blueprints.items?.get(id) || null
  }

  getAllBlueprints() {
    return Array.from(this.blueprints.items?.values() || [])
  }

  updateBlueprint(id, updates) {
    const existing = this.blueprints.items?.get(id)
    if (!existing) {
      logger.error('Blueprint not found for update', { id })
      return false
    }

    const merged = { ...existing, ...updates }
    const validated = this.validate(merged)
    const normalized = this.normalize(validated)
    return this.store(normalized)
  }

  deleteBlueprint(id) {
    if (!this.blueprints.items) return false
    return this.blueprints.items.delete(id)
  }

  hasBlueprint(id) {
    return this.blueprints.items?.has(id) || false
  }

  count() {
    return this.blueprints.items?.size || 0
  }
}
