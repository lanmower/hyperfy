import SecurityConfig from '../../server/config/SecurityConfig.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('InputSanitizer')

export class InputSanitizer {
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

    const cleanedCode = this.removeComments(scriptCode)

    for (const { pattern, name } of SecurityConfig.dangerousPatterns) {
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

    const stringLiterals = this.extractStringLiterals(cleanedCode)
    for (const literal of stringLiterals) {
      if (literal.length > SecurityConfig.limits.maxStringLiteral) {
        violations.push({
          type: 'STRING_SIZE',
          message: `String literal size ${literal.length} exceeds maximum ${SecurityConfig.limits.maxStringLiteral}`,
        })
      }
    }

    if (violations.length > 0) {
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

    if (violations.length > 0) {
      logger.info('Property validation failed', { depth, violationCount: violations.length, violations })
      return { valid: false, violations }
    }

    return { valid: true, violations: [] }
  }

  static validateURL(url) {
    const violations = []

    if (!url || typeof url !== 'string') {
      return {
        valid: false,
        violations: [{ type: 'TYPE_ERROR', message: 'URL must be a string' }],
      }
    }

    if (url.length > SecurityConfig.limits.maxUrlLength) {
      violations.push({
        type: 'URL_LENGTH',
        message: `URL length ${url.length} exceeds maximum ${SecurityConfig.limits.maxUrlLength}`,
      })
      return { valid: false, violations }
    }

    let parsed
    try {
      parsed = new URL(url)
    } catch (err) {
      violations.push({
        type: 'INVALID_URL',
        message: `Invalid URL format: ${err.message}`,
      })
      return { valid: false, violations }
    }

    if (!SecurityConfig.urlConfig.allowedProtocols.includes(parsed.protocol)) {
      violations.push({
        type: 'INVALID_PROTOCOL',
        protocol: parsed.protocol,
        message: `Protocol ${parsed.protocol} not allowed. Only http: and https: are permitted.`,
      })
    }

    const hostname = parsed.hostname.toLowerCase()
    for (const pattern of SecurityConfig.urlConfig.blockedPatterns) {
      if (pattern.test(hostname)) {
        violations.push({
          type: 'BLOCKED_HOST',
          hostname,
          message: `Access to internal/localhost addresses is blocked: ${hostname}`,
        })
        break
      }
    }

    if (violations.length > 0) {
      logger.info('URL validation failed', { url, violationCount: violations.length, violations })
      return { valid: false, violations }
    }

    return { valid: true, violations: [] }
  }

  static validateFilePath(filePath) {
    const violations = []

    if (!filePath || typeof filePath !== 'string') {
      return {
        valid: false,
        violations: [{ type: 'TYPE_ERROR', message: 'File path must be a string' }],
      }
    }

    const normalized = filePath.replace(/\\/g, '/')

    for (const pattern of SecurityConfig.pathTraversalPatterns) {
      const toCheck = typeof pattern === 'string' ? pattern : pattern.source ? pattern : null
      if (toCheck) {
        if (typeof pattern === 'string' ? normalized.includes(pattern) : pattern.test(normalized)) {
          violations.push({
            type: 'PATH_TRAVERSAL',
            message: 'Path traversal or system directory access detected',
          })
          break
        }
      }
    }

    if (violations.length > 0) {
      logger.info('File path validation failed', { filePath, violationCount: violations.length, violations })
      return { valid: false, violations }
    }

    return { valid: true, violations: [] }
  }

  static validateRegex(pattern) {
    const violations = []

    if (!pattern || typeof pattern !== 'string') {
      return {
        valid: false,
        violations: [{ type: 'TYPE_ERROR', message: 'Regex pattern must be a string' }],
      }
    }

    for (const dangerous of SecurityConfig.regexRedosPatterns) {
      if (dangerous.test(pattern)) {
        violations.push({
          type: 'REDOS_RISK',
          message: 'Regular expression may cause ReDoS attack',
        })
        break
      }
    }

    try {
      new RegExp(pattern)
    } catch (err) {
      violations.push({
        type: 'INVALID_REGEX',
        message: `Invalid regular expression: ${err.message}`,
      })
    }

    if (violations.length > 0) {
      logger.info('Regex validation failed', { pattern, violationCount: violations.length, violations })
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

    if (violations.length > 0) {
      logger.info('Entity data validation failed', { entityId: data.id, violationCount: violations.length, violations })
      return { valid: false, violations }
    }

    return { valid: true, violations: [] }
  }

  static removeComments(code) {
    let cleaned = code.replace(/\/\*[\s\S]*?\*\//g, ' ')
    cleaned = cleaned.replace(/\/\/.*$/gm, ' ')
    return cleaned
  }

  static extractStringLiterals(code) {
    const literals = []
    const singleQuoteRegex = /'(?:[^'\\]|\\.)*'/g
    const doubleQuoteRegex = /"(?:[^"\\]|\\.)*"/g
    const templateRegex = /`(?:[^`\\]|\\.)*`/g

    let match
    while ((match = singleQuoteRegex.exec(code)) !== null) {
      literals.push(match[0])
    }
    while ((match = doubleQuoteRegex.exec(code)) !== null) {
      literals.push(match[0])
    }
    while ((match = templateRegex.exec(code)) !== null) {
      literals.push(match[0])
    }

    return literals
  }
}
