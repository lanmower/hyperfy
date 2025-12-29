import { AppValidator } from '../../validators/AppValidator.js'
import { normalizeBlueprint } from '../../schemas/AppBlueprint.schema.js'
import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('BlueprintParser')

export class BlueprintParser {
  constructor(world, blueprints) {
    this.world = world
    this.blueprints = blueprints
  }

  validate(data) {
    const validation = AppValidator.validateBlueprint(data)
    if (!validation.valid) {
      logger.warn('Blueprint validation warning', { blueprintId: data.id, error: validation.error })
    }
    return validation
  }

  normalize(data) {
    return normalizeBlueprint(data)
  }

  store(normalized) {
    this.blueprints.items.set(normalized.id, normalized)
  }
}
