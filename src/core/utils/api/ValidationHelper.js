export class ValidationHelper {
  static assertEntityValid(entity, context = {}) {
    if (!entity) throw new Error('Entity is invalid or null')
  }

  static assertIsString(value, paramName, context = {}) {
    if (typeof value !== 'string') throw new Error(`${paramName} must be a string`)
  }

  static assertIsNumber(value, paramName, context = {}) {
    if (typeof value !== 'number') throw new Error(`${paramName} must be a number`)
  }

  static assertIsVector3(value, paramName, context = {}) {
    if (!value || typeof value.x !== 'number' || typeof value.y !== 'number' || typeof value.z !== 'number') {
      throw new Error(`${paramName} must be a Vector3`)
    }
  }

  static assertNotNull(value, paramName, context = {}) {
    if (value === null || value === undefined) throw new Error(`${paramName} cannot be null or undefined`)
  }

  static assertIsObject(value, paramName, context = {}) {
    if (!value || typeof value !== 'object') throw new Error(`${paramName} must be an object`)
  }
}
