import { LoggerFactory } from '../../core/utils/logging/index.js'

const logger = LoggerFactory.get('XSSProtector')

const DANGEROUS_TAGS = new Set([
  'script', 'iframe', 'embed', 'object', 'applet', 'meta', 'link', 'style',
  'form', 'input', 'button', 'textarea', 'select', 'option',
])

const DANGEROUS_ATTRIBUTES = new Set([
  'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onchange',
  'onsubmit', 'onblur', 'onfocus', 'onkeydown', 'onkeyup', 'onpaste',
  'ondrop', 'ondrag', 'oninput', 'onwheel', 'onscroll', 'oncontextmenu',
  'style', 'data', 'src', 'href', 'action', 'formaction',
])

const HTML_ENTITY_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
}

export class XSSProtector {
  static sanitizeText(text) {
    if (typeof text !== 'string') {
      return ''
    }

    return text.replace(/[&<>"'\/]/g, char => HTML_ENTITY_MAP[char] || char)
  }

  static validateContentType(content) {
    if (content === null || content === undefined) return { valid: true, type: 'null' }
    if (typeof content === 'string') return { valid: true, type: 'string', length: content.length }
    if (typeof content === 'number' || typeof content === 'boolean') return { valid: true, type: typeof content }
    if (Array.isArray(content)) return content.length > 10000 ? { valid: false, error: 'Array too large' } : { valid: true, type: 'array', length: content.length }
    if (typeof content === 'object') {
      const keys = Object.keys(content)
      return keys.length > 1000 ? { valid: false, error: 'Object has too many properties' } : { valid: true, type: 'object', properties: keys.length }
    }
    return { valid: false, error: 'Unsupported content type' }
  }

  static sanitizeHTML(html, config = {}) {
    if (typeof html !== 'string') {
      return ''
    }

    if (html.length > config.maxLength || 100000) {
      logger.warn('HTML content exceeds maximum length', { length: html.length })
      return ''
    }

    let cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<embed[^>]*>/gi, '')
      .replace(/<object[^>]*>.*?<\/object>/gi, '')

    const parser = new DOMParser()
    let doc
    try {
      doc = parser.parseFromString(cleaned, 'text/html')
    } catch (err) {
      logger.warn('HTML parsing failed', { error: err.message })
      return this.sanitizeText(cleaned)
    }

    this.sanitizeElement(doc.body, config)

    const serializer = new XMLSerializer()
    return serializer.serializeToString(doc.body).replace(/<body[^>]*>|<\/body>/g, '')
  }

  static sanitizeElement(element, config = {}) {
    const nodesToRemove = []

    for (const node of element.childNodes) {
      if (node.nodeType === 1) {
        const tagName = node.tagName.toLowerCase()

        if (DANGEROUS_TAGS.has(tagName)) {
          nodesToRemove.push(node)
          continue
        }

        const attributesToRemove = []
        for (const attr of node.attributes || []) {
          if (DANGEROUS_ATTRIBUTES.has(attr.name.toLowerCase())) {
            attributesToRemove.push(attr.name)
          }
        }

        for (const attrName of attributesToRemove) {
          node.removeAttribute(attrName)
        }

        this.sanitizeElement(node, config)
      }
    }

    for (const node of nodesToRemove) {
      node.parentNode.removeChild(node)
    }
  }

  static sanitizeAttributes(element, allowedAttrs = []) {
    if (!element || !element.attributes) {
      return element
    }

    const attrsToRemove = []
    for (const attr of element.attributes) {
      const attrName = attr.name.toLowerCase()
      if (!allowedAttrs.includes(attrName) || DANGEROUS_ATTRIBUTES.has(attrName)) {
        attrsToRemove.push(attr.name)
      }
    }

    for (const attrName of attrsToRemove) {
      element.removeAttribute(attrName)
    }

    return element
  }

  static checkForXSSPatterns(text) {
    const patterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /on\w+\s*=/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /<iframe/gi,
      /<embed/gi,
      /<object/gi,
    ]

    const violations = []
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        violations.push(pattern.toString())
      }
    }

    if (violations.length > 0) {
      logger.warn('Potential XSS detected', {
        violationCount: violations.length,
        patterns: violations,
      })
    }

    return violations
  }

  static sanitizeJSON(jsonStr) {
    if (typeof jsonStr !== 'string') {
      return null
    }

    try {
      const obj = JSON.parse(jsonStr)
      return JSON.stringify(this.sanitizeObject(obj))
    } catch (err) {
      logger.warn('JSON parsing failed', { error: err.message })
      return null
    }
  }

  static sanitizeObject(obj) {
    if (typeof obj === 'string') {
      return this.sanitizeText(obj)
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item))
    }

    if (obj !== null && typeof obj === 'object') {
      const sanitized = {}
      for (const [key, value] of Object.entries(obj)) {
        sanitized[this.sanitizeText(key)] = this.sanitizeObject(value)
      }
      return sanitized
    }

    return obj
  }
}

export function createXSSProtector() {
  return new XSSProtector()
}
