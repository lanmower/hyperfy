const ErrorCodes = {
  INPUT_VALIDATION: {
    code: 'INPUT_VALIDATION',
    category: 'validation',
    severity: 'high',
  },
  RESOURCE_NOT_FOUND: {
    code: 'RESOURCE_NOT_FOUND',
    category: 'resource',
    severity: 'high',
  },
  INVALID_STATE: {
    code: 'INVALID_STATE',
    category: 'state',
    severity: 'high',
  },
  NETWORK_FAILURE: {
    code: 'NETWORK_FAILURE',
    category: 'network',
    severity: 'high',
  },
  PHYSICS_ERROR: {
    code: 'PHYSICS_ERROR',
    category: 'physics',
    severity: 'medium',
  },
  SCRIPT_ERROR: {
    code: 'SCRIPT_ERROR',
    category: 'script',
    severity: 'medium',
  },
  TYPE_MISMATCH: {
    code: 'TYPE_MISMATCH',
    category: 'validation',
    severity: 'high',
  },
  NULL_REFERENCE: {
    code: 'NULL_REFERENCE',
    category: 'reference',
    severity: 'high',
  },
  RESOURCE_LIMIT: {
    code: 'RESOURCE_LIMIT',
    category: 'resource',
    severity: 'medium',
  },
  PERMISSION_DENIED: {
    code: 'PERMISSION_DENIED',
    category: 'auth',
    severity: 'high',
  },
  OPERATION_NOT_SUPPORTED: {
    code: 'OPERATION_NOT_SUPPORTED',
    category: 'operation',
    severity: 'medium',
  },
  INITIALIZATION_FAILED: {
    code: 'INITIALIZATION_FAILED',
    category: 'initialization',
    severity: 'high',
  },
}

export class HyperfyError extends Error {
  constructor(code, message, context = {}) {
    const errorInfo = ErrorCodes[code]
    const fullMessage = errorInfo ? `[${code}] ${message}` : message
    super(fullMessage)

    this.name = 'HyperfyError'
    this.code = code
    this.errorInfo = errorInfo
    this.context = context
    this.timestamp = Date.now()
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      severity: this.errorInfo?.severity,
      category: this.errorInfo?.category,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    }
  }
}

export default ErrorCodes
