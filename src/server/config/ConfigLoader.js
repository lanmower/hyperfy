// Type-aware environment variable loader: Auto-detects type from default value
export class ConfigLoader {
  static get(path, defaultValue, type = 'auto') {
    const envVarName = `HYPERFY_${path.split('.').join('_').toUpperCase()}`
    const envValue = process.env[envVarName]

    if (envValue === undefined || envValue === '') {
      return defaultValue
    }

    const targetType = type === 'auto' ? typeof defaultValue : type
    return this.cast(envValue, targetType, defaultValue)
  }

  static cast(value, type, defaultValue) {
    if (type === 'number') {
      const num = parseFloat(value)
      return isNaN(num) ? defaultValue : num
    }

    if (type === 'boolean') {
      return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes'
    }

    return String(value).trim()
  }

  static merge(source, result, prefix) {
    for (const key in source) {
      const value = source[key]
      const path = prefix ? `${prefix}.${key}` : key

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = {}
        this.merge(value, result[key], path)
      } else {
        result[key] = this.get(path, value, 'auto')
      }
    }

    return result
  }
}

export default ConfigLoader
