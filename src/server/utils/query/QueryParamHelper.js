export class QueryParamHelper {
  static parseQueryInt(value, defaultValue = 0) {
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? defaultValue : parsed
  }

  static parseQueryFloat(value, defaultValue = 0.0) {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? defaultValue : parsed
  }

  static parseQueryBool(value, defaultValue = false) {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true'
    }
    return defaultValue
  }
}
