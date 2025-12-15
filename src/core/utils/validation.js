// Data validation utilities

export function isValidId(id) {
  return typeof id === 'string' && id.length > 0
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidUrl(url) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function isValidJSON(str) {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

export function sanitizeString(str, maxLength = 256) {
  if (typeof str !== 'string') return ''
  return str.trim().slice(0, maxLength)
}

export function sanitizeObject(obj, allowedKeys) {
  if (!allowedKeys) return obj
  const result = {}
  for (const key of allowedKeys) {
    if (key in obj) result[key] = obj[key]
  }
  return result
}

export function validateRequired(value, fieldName) {
  if (!value) throw new Error(`${fieldName} is required`)
  return value
}

export function validateType(value, type, fieldName) {
  if (typeof value !== type) {
    throw new Error(`${fieldName} must be ${type}, got ${typeof value}`)
  }
  return value
}

export function validateRange(value, min, max, fieldName) {
  if (value < min || value > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`)
  }
  return value
}

export function clampValue(value, min, max) {
  return Math.max(min, Math.min(max, value))
}
