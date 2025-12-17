
export const ErrorPatterns = {
  EXPLICIT_ERRORS: [
    'app.script.load',
    'app.model.load',
    'app.script.compile',
    'app.script.runtime',
    'blueprint.validation',
    'gltfloader.error',
    'console.error',
    'console.warn'
  ],

  MESSAGE_PATTERNS: [
    'gltfloader',
    'syntaxerror',
    'unexpected token',
    'json.parse',
    'failed to load',
    'failed to parse',
    'referenceerror',
    'typeerror',
    'cannot read',
    'is not defined',
    'is not a function',
    'model.load',
    'script.load',
    'asset loading',
    'three.js',
    'webgl',
    'shader',
    'texture',
    'geometry',
    'material',
    'network error',
    'script crashed',
    'blueprint not found'
  ],

  REGEX_PATTERNS: [
    /gltfloader/i,
    /syntax.*error/i,
    /unexpected.*token/i,
    /failed.*to.*load/i,
    /network.*error/i,
    /script.*crashed/i,
    /three\.js/i,
    /webgl/i,
    /blueprint.*not.*found/i,
    /app\.blueprint\.missing/i
  ],

  isCritical(type, message) {
    if (this.EXPLICIT_ERRORS.includes(type)) return true

    const text = (message || '').toString().toLowerCase()

    for (const pattern of this.REGEX_PATTERNS) {
      if (pattern.test(text)) return true
    }

    for (const pattern of this.MESSAGE_PATTERNS) {
      if (text.includes(pattern.toLowerCase())) return true
    }

    return false
  },

  matchesPatterns(text, blueprintId) {
    if (!text) return false

    const lower = text.toLowerCase()

    for (const pattern of this.REGEX_PATTERNS) {
      if (pattern.test(lower)) return true
    }

    for (const pattern of this.MESSAGE_PATTERNS) {
      if (lower.includes(pattern.toLowerCase())) return true
    }

    return blueprintId ? lower.includes(blueprintId.toLowerCase()) : false
  }
}
