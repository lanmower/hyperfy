import { SecurityConfig } from './SecurityConfig.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('InputSanitizer')

export class InputSanitizerPatterns {
  static COMMENT_BLOCK = /\/\*[\s\S]*?\*\//g
  static COMMENT_LINE = /\/\/.*$/gm

  static STRING_SINGLE = /'(?:[^'\\]|\\.)*'/g
  static STRING_DOUBLE = /"(?:[^"\\]|\\.)*"/g
  static STRING_TEMPLATE = /`(?:[^`\\]|\\.)*`/g

  static dangerousPatterns() {
    return SecurityConfig.dangerousPatterns
  }

  static urlBlockedPatterns() {
    return SecurityConfig.urlConfig.blockedPatterns
  }

  static pathTraversalPatterns() {
    return SecurityConfig.pathTraversalPatterns
  }

  static regexRedosPatterns() {
    return SecurityConfig.regexRedosPatterns
  }

  static removeComments(code) {
    let cleaned = code.replace(this.COMMENT_BLOCK, ' ')
    cleaned = cleaned.replace(this.COMMENT_LINE, ' ')
    return cleaned
  }

  static extractStringLiterals(code) {
    const literals = []
    let match

    while ((match = this.STRING_SINGLE.exec(code)) !== null) {
      literals.push(match[0])
    }
    while ((match = this.STRING_DOUBLE.exec(code)) !== null) {
      literals.push(match[0])
    }
    while ((match = this.STRING_TEMPLATE.exec(code)) !== null) {
      literals.push(match[0])
    }

    return literals
  }

  static validateRegex(pattern) {
    const violations = []

    if (!pattern || typeof pattern !== 'string') {
      return {
        valid: false,
        violations: [{ type: 'TYPE_ERROR', message: 'Regex pattern must be a string' }],
      }
    }

    for (const dangerous of SecurityConfig.regexRedosPatterns || []) {
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

    if (violations.length) {
      logger.info('Regex validation failed', { pattern, violationCount: violations.length, violations })
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

    for (const pattern of SecurityConfig.pathTraversalPatterns || []) {
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

    if (violations.length) {
      logger.info('File path validation failed', { filePath, violationCount: violations.length, violations })
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
    for (const pattern of this.urlBlockedPatterns()) {
      if (pattern.test(hostname)) {
        violations.push({
          type: 'BLOCKED_HOST',
          hostname,
          message: `Access to internal/localhost addresses is blocked: ${hostname}`,
        })
        break
      }
    }

    if (violations.length) {
      logger.info('URL validation failed', { url, violationCount: violations.length, violations })
      return { valid: false, violations }
    }

    return { valid: true, violations: [] }
  }
}
