import { AppValidator } from '../../validators/AppValidator.js'
import { normalizeBlueprint } from '../../schemas/AppBlueprint.schema.js'

export class BlueprintParser {
  constructor(world, blueprints) {
    this.world = world
    this.blueprints = blueprints
  }

  validate(data) {
    const validation = AppValidator.validateBlueprint(data)
    if (!validation.valid) {
      console.warn(`Blueprint validation warning for ${data.id}:`, validation.error)
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
