import { InputSanitizer } from '../security/InputSanitizer.js'
import { AppValidator } from '../validation/AppValidator.js'

const appValidator = new AppValidator()

export class BlueprintValidator {
  constructor(logger) {
    this.logger = logger || { info: () => {}, warn: () => {}, error: () => {} }
  }

  validate(data) {
    const validation = appValidator.validateBlueprint(data)
    if (!validation.valid) {
      throw new Error(`Blueprint validation failed: ${validation.error}`)
    }
    return data
  }

  validateScript(scriptData, blueprintId) {
    const validation = InputSanitizer.validateScript(scriptData)
    if (!validation.valid) {
      this.logger.warn('Script validation failed for blueprint', {
        blueprintId,
        violationCount: validation.violations.length,
        violations: validation.violations,
      })
    }
    return validation
  }

  validateProperties(propsData, blueprintId) {
    const validation = InputSanitizer.validateProperties(propsData)
    if (!validation.valid) {
      this.logger.warn('Properties validation failed for blueprint', {
        blueprintId,
        violationCount: validation.violations.length,
        violations: validation.violations,
      })
    }
    return validation
  }

  validateJSON(data) {
    if (!data) {
      throw new Error('Blueprint data is required')
    }
    if (typeof data !== 'object') {
      throw new Error('Blueprint data must be an object')
    }
    return true
  }

  validateRequiredFields(blueprint) {
    if (!blueprint.id) {
      throw new Error('Blueprint must have an id field')
    }
    return true
  }

  normalize(data) {
    return appValidator.normalizeBlueprint(data)
  }
}
