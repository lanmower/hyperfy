import { InputSanitizer } from '../../core/security/InputSanitizer.js'
import { LoggerFactory } from '../../core/utils/logging/index.js'

const logger = LoggerFactory.get('ScriptValidator')

export class ScriptValidator {
  static validateBlueprint(blueprint, context = {}) {
    const violations = []
    const { userId, blueprintId, entityId } = context

    if (!blueprint || typeof blueprint !== 'object') {
      return {
        valid: false,
        violations: [{ type: 'TYPE_ERROR', message: 'Blueprint must be an object' }],
      }
    }

    if (blueprint.script) {
      const scriptResult = InputSanitizer.validateScript(blueprint.script)
      if (!scriptResult.valid) {
        violations.push(
          ...scriptResult.violations.map(v => ({
            ...v,
            source: 'blueprint.script',
            blueprintId: blueprint.id || blueprintId,
          }))
        )
        logger.info('Blueprint script validation failed', {
          blueprintId: blueprint.id || blueprintId,
          userId,
          violationCount: scriptResult.violations.length,
        })
      }
    }

    if (blueprint.props) {
      const propsResult = InputSanitizer.validateProperties(blueprint.props)
      if (!propsResult.valid) {
        violations.push(
          ...propsResult.violations.map(v => ({
            ...v,
            source: 'blueprint.props',
            blueprintId: blueprint.id || blueprintId,
          }))
        )
        logger.info('Blueprint props validation failed', {
          blueprintId: blueprint.id || blueprintId,
          userId,
          violationCount: propsResult.violations.length,
        })
      }
    }

    if (blueprint.model) {
      const urlResult = InputSanitizer.validateURL(blueprint.model)
      if (!urlResult.valid) {
        violations.push(
          ...urlResult.violations.map(v => ({
            ...v,
            source: 'blueprint.model',
            blueprintId: blueprint.id || blueprintId,
          }))
        )
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    }
  }

  static validateEntityData(entityData, context = {}) {
    const violations = []
    const { userId, entityId } = context

    const dataResult = InputSanitizer.validateEntityData(entityData)
    if (!dataResult.valid) {
      violations.push(
        ...dataResult.violations.map(v => ({
          ...v,
          entityId: entityData.id || entityId,
        }))
      )
      logger.info('Entity data validation failed', {
        entityId: entityData.id || entityId,
        userId,
        violationCount: dataResult.violations.length,
      })
    }

    return {
      valid: violations.length === 0,
      violations,
    }
  }

  static validateFetchURL(url, context = {}) {
    const { appId, entityId, userId } = context

    const urlResult = InputSanitizer.validateURL(url)
    if (!urlResult.valid) {
      logger.info('Fetch URL validation failed', {
        url,
        appId,
        entityId,
        userId,
        violationCount: urlResult.violations.length,
      })
    }

    return urlResult
  }

  static sanitizeBlueprint(blueprint, context = {}) {
    const validation = this.validateBlueprint(blueprint, context)

    if (!validation.valid) {
      const sanitized = { ...blueprint }

      const scriptViolations = validation.violations.filter(v => v.source === 'blueprint.script')
      if (scriptViolations.length) {
        delete sanitized.script
        logger.warn('Removed dangerous script from blueprint', {
          blueprintId: blueprint.id,
          violationCount: scriptViolations.length,
        })
      }

      const propsViolations = validation.violations.filter(v => v.source === 'blueprint.props')
      if (propsViolations.length) {
        sanitized.props = this.sanitizeProperties(blueprint.props)
        logger.warn('Sanitized blueprint props', {
          blueprintId: blueprint.id,
          violationCount: propsViolations.length,
        })
      }

      const modelViolations = validation.violations.filter(v => v.source === 'blueprint.model')
      if (modelViolations.length) {
        delete sanitized.model
        logger.warn('Removed invalid model URL from blueprint', {
          blueprintId: blueprint.id,
          violationCount: modelViolations.length,
        })
      }

      return { sanitized, violations: validation.violations }
    }

    return { sanitized: blueprint, violations: [] }
  }

  static sanitizeProperties(props, depth = 0, maxDepth = 10) {
    if (!props || typeof props !== 'object') {
      return props
    }

    if (depth > maxDepth) {
      return null
    }

    if (Array.isArray(props)) {
      return props
        .map(item => {
          if (typeof item === 'object' && item !== null) {
            return this.sanitizeProperties(item, depth + 1, maxDepth)
          }
          if (typeof item === 'string' && item.length > 100 * 1024) {
            return item.substring(0, 100 * 1024)
          }
          return item
        })
        .filter(item => item !== null)
    }

    const sanitized = {}
    for (const key in props) {
      if (!props.hasOwnProperty(key)) continue

      const value = props[key]
      if (typeof value === 'object' && value !== null) {
        const sanitizedValue = this.sanitizeProperties(value, depth + 1, maxDepth)
        if (sanitizedValue !== null) {
          sanitized[key] = sanitizedValue
        }
      } else if (typeof value === 'string' && value.length > 100 * 1024) {
        sanitized[key] = value.substring(0, 100 * 1024)
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }
}
