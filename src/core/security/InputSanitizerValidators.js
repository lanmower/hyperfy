import { SecurityConfig } from './SecurityConfig.js'
import { InputSanitizerPatterns } from './InputSanitizerPatterns.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('InputSanitizerValidators')

export class InputSanitizerValidators {
  static validateScript(scriptCode) {
    const violations = []

    if (!scriptCode || typeof scriptCode !== 'string') {
      return {
        valid: false,
        violations: [{ type: 'TYPE_ERROR', message: 'Script must be a string' }],
      }
    }

    if (scriptCode.length > SecurityConfig.limits.maxScriptSize) {
      violations.push({
        type: 'SIZE_LIMIT',
        message: `Script size ${scriptCode.length} exceeds maximum ${SecurityConfig.limits.maxScriptSize}`,
      })
      return { valid: false, violations }
    }

    const cleanedCode = InputSanitizerPatterns.removeComments(scriptCode)

    for (const { pattern, name } of InputSanitizerPatterns.dangerousPatterns()) {
      const matches = cleanedCode.match(pattern)
      if (matches) {
        violations.push({
          type: 'DANGEROUS_PATTERN',
          pattern: name,
          message: `Dangerous pattern detected: ${name}`,
          occurrences: matches.length,
        })
      }
    }

    const stringLiterals = InputSanitizerPatterns.extractStringLiterals(cleanedCode)
    for (const literal of stringLiterals) {
      if (literal.length > SecurityConfig.limits.maxStringLiteral) {
        violations.push({
          type: 'STRING_SIZE',
          message: `String literal size ${literal.length} exceeds maximum ${SecurityConfig.limits.maxStringLiteral}`,
        })
      }
    }

    if (violations.length) {
      logger.info('Script validation failed', { violationCount: violations.length, violations })
      return { valid: false, violations }
    }

    return { valid: true, violations: [] }
  }


  static validateProperties(props, depth = 0) {
    const violations = []

    if (!props || typeof props !== 'object') {
      return {
        valid: true,
        violations: [],
      }
    }

    if (depth > SecurityConfig.limits.maxPropertyDepth) {
      violations.push({
        type: 'DEPTH_LIMIT',
        message: `Property depth ${depth} exceeds maximum ${SecurityConfig.limits.maxPropertyDepth}`,
      })
      return { valid: false, violations }
    }

    if (Array.isArray(props)) {
      for (let i = 0; i < props.length; i++) {
        const value = props[i]
        if (typeof value === 'object' && value !== null) {
          const result = this.validateProperties(value, depth + 1)
          if (!result.valid) {
            violations.push(...result.violations)
          }
        } else if (typeof value === 'string' && value.length > SecurityConfig.limits.maxStringLiteral) {
          violations.push({
            type: 'STRING_SIZE',
            path: `[${i}]`,
            message: `String size ${value.length} exceeds maximum ${SecurityConfig.limits.maxStringLiteral}`,
          })
        }
      }
    } else {
      for (const key in props) {
        if (!props.hasOwnProperty(key)) continue

        const value = props[key]

        if (typeof value === 'object' && value !== null) {
          const result = this.validateProperties(value, depth + 1)
          if (!result.valid) {
            violations.push(
              ...result.violations.map(v => ({
                ...v,
                path: `${key}.${v.path || ''}`.replace(/\.$/, ''),
              }))
            )
          }
        } else if (typeof value === 'string') {
          if (value.length > SecurityConfig.limits.maxStringLiteral) {
            violations.push({
              type: 'STRING_SIZE',
              path: key,
              message: `String size ${value.length} exceeds maximum ${SecurityConfig.limits.maxStringLiteral}`,
            })
          }
        }
      }
    }

    if (violations.length) {
      logger.info('Property validation failed', { depth, violationCount: violations.length, violations })
      return { valid: false, violations }
    }

    return { valid: true, violations: [] }
  }

  static validateEntityData(data) {
    const violations = []

    if (!data || typeof data !== 'object') {
      return {
        valid: false,
        violations: [{ type: 'TYPE_ERROR', message: 'Entity data must be an object' }],
      }
    }

    if (data.id && typeof data.id !== 'string') {
      violations.push({
        type: 'TYPE_ERROR',
        field: 'id',
        message: 'Entity id must be a string',
      })
    }

    if (data.position && !Array.isArray(data.position)) {
      violations.push({
        type: 'TYPE_ERROR',
        field: 'position',
        message: 'Entity position must be an array',
      })
    } else if (data.position && data.position.length !== 3) {
      violations.push({
        type: 'INVALID_VALUE',
        field: 'position',
        message: 'Entity position must have 3 elements',
      })
    }

    if (data.quaternion && !Array.isArray(data.quaternion)) {
      violations.push({
        type: 'TYPE_ERROR',
        field: 'quaternion',
        message: 'Entity quaternion must be an array',
      })
    } else if (data.quaternion && data.quaternion.length !== 4) {
      violations.push({
        type: 'INVALID_VALUE',
        field: 'quaternion',
        message: 'Entity quaternion must have 4 elements',
      })
    }

    if (data.scale && !Array.isArray(data.scale)) {
      violations.push({
        type: 'TYPE_ERROR',
        field: 'scale',
        message: 'Entity scale must be an array',
      })
    } else if (data.scale && data.scale.length !== 3) {
      violations.push({
        type: 'INVALID_VALUE',
        field: 'scale',
        message: 'Entity scale must have 3 elements',
      })
    }

    if (data.state) {
      const stateResult = this.validateProperties(data.state)
      if (!stateResult.valid) {
        violations.push(
          ...stateResult.violations.map(v => ({
            ...v,
            field: `state.${v.path || ''}`.replace(/\.$/, ''),
          }))
        )
      }
    }

    if (violations.length) {
      logger.info('Entity data validation failed', { entityId: data.id, violationCount: violations.length, violations })
      return { valid: false, violations }
    }

    return { valid: true, violations: [] }
  }
}
