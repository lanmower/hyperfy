import { HyperfyError } from './ErrorCodes.js'

export class ValidationHelper {
  static assertNotNull(value, paramName, context = {}) {
    if (value === null || value === undefined) {
      throw new HyperfyError('NULL_REFERENCE', `Parameter ${paramName} is null or undefined`, {
        paramName,
        ...context,
      })
    }
    return value
  }

  static assertType(value, expectedType, paramName, context = {}) {
    if (typeof value !== expectedType) {
      throw new HyperfyError('TYPE_MISMATCH', `Parameter ${paramName} must be ${expectedType}, got ${typeof value}`, {
        paramName,
        expectedType,
        actualType: typeof value,
        ...context,
      })
    }
    return value
  }

  static assertIsVector3(value, paramName, context = {}) {
    if (!value?.isVector3) {
      throw new HyperfyError('TYPE_MISMATCH', `Parameter ${paramName} must be a Vector3`, {
        paramName,
        expectedType: 'Vector3',
        actualType: value?.constructor?.name,
        ...context,
      })
    }
    return value
  }

  static assertIsNumber(value, paramName, context = {}) {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new HyperfyError('TYPE_MISMATCH', `Parameter ${paramName} must be a valid number`, {
        paramName,
        value,
        ...context,
      })
    }
    return value
  }

  static assertIsArray(value, paramName, context = {}) {
    if (!Array.isArray(value)) {
      throw new HyperfyError('TYPE_MISMATCH', `Parameter ${paramName} must be an array`, {
        paramName,
        actualType: typeof value,
        ...context,
      })
    }
    return value
  }

  static assertIsString(value, paramName, context = {}) {
    if (typeof value !== 'string') {
      throw new HyperfyError('TYPE_MISMATCH', `Parameter ${paramName} must be a string`, {
        paramName,
        actualType: typeof value,
        ...context,
      })
    }
    return value
  }

  static assertIsObject(value, paramName, context = {}) {
    if (value === null || typeof value !== 'object') {
      throw new HyperfyError('TYPE_MISMATCH', `Parameter ${paramName} must be an object`, {
        paramName,
        actualType: typeof value,
        ...context,
      })
    }
    return value
  }

  static assertEntityValid(entity, context = {}) {
    if (!entity) {
      throw new HyperfyError('NULL_REFERENCE', 'Entity is null or undefined', context)
    }
    if (!entity.data || !entity.data.id) {
      throw new HyperfyError('INVALID_STATE', 'Entity has invalid structure', {
        entity: entity?.constructor?.name,
        ...context,
      })
    }
    return entity
  }

  static assertBlueprintValid(blueprint, context = {}) {
    if (!blueprint) {
      throw new HyperfyError('RESOURCE_NOT_FOUND', 'Blueprint is null or undefined', context)
    }
    return blueprint
  }

  static assertNodeValid(node, context = {}) {
    if (!node) {
      throw new HyperfyError('NULL_REFERENCE', 'Node is null or undefined', context)
    }
    return node
  }

  static validateEntityOperation(entity, operationName, context = {}) {
    this.assertEntityValid(entity, { operationName, ...context })
    if (!entity.root) {
      throw new HyperfyError('INVALID_STATE', `Cannot perform ${operationName}: entity.root is not initialized`, {
        operationName,
        ...context,
      })
    }
    return entity
  }

  static validateNumberInRange(value, min, max, paramName, context = {}) {
    this.assertIsNumber(value, paramName, context)
    if (value < min || value > max) {
      throw new HyperfyError('INPUT_VALIDATION', `Parameter ${paramName} must be between ${min} and ${max}`, {
        paramName,
        value,
        min,
        max,
        ...context,
      })
    }
    return value
  }

  static validateNonEmptyString(value, paramName, context = {}) {
    this.assertIsString(value, paramName, context)
    if (value.trim().length === 0) {
      throw new HyperfyError('INPUT_VALIDATION', `Parameter ${paramName} cannot be empty`, {
        paramName,
        ...context,
      })
    }
    return value
  }

  static validateFileType(url, allowedTypes, context = {}) {
    if (!url) {
      throw new HyperfyError('INPUT_VALIDATION', 'File URL is required', context)
    }
    const ext = url.split('.').pop()?.toLowerCase()
    if (!allowedTypes.includes(ext)) {
      throw new HyperfyError('INPUT_VALIDATION', `File type .${ext} not allowed. Expected: ${allowedTypes.join(', ')}`, {
        url,
        ext,
        allowedTypes,
        ...context,
      })
    }
    return url
  }

  static assertWebsocket(isServer, operationName, context = {}) {
    if (!isServer) {
      throw new HyperfyError('PERMISSION_DENIED', `${operationName} can only be called on the server`, {
        operationName,
        ...context,
      })
    }
  }
}

export default ValidationHelper
