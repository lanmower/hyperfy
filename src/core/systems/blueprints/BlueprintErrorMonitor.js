import { ErrorPatterns } from '../../utils/errorPatterns.js'

export class BlueprintErrorMonitor {
  constructor(world, blueprints) {
    this.world = world
    this.blueprints = blueprints
  }

  isBlueprintRelatedError(error, blueprintId) {
    if (ErrorPatterns.EXPLICIT_ERRORS.includes(error.type)) {
      return true
    }
    const errorMessage = error.args ? error.args.join(' ') : ''
    const stack = error.stack || ''
    if (ErrorPatterns.matchesPatterns(errorMessage, blueprintId) || ErrorPatterns.matchesPatterns(stack, blueprintId)) {
      return true
    }
    return true
  }

  async executeWithErrorMonitoring(blueprintId, operation) {
    const errorMonitor = this.blueprints.errorMonitor
    if (!errorMonitor) return await operation()

    const errorsBefore = errorMonitor.getErrors({ limit: 1000 }).length
    const result = await operation()

    await new Promise(resolve => setTimeout(resolve, 1000))

    const errorsAfter = errorMonitor.getErrors({ limit: 1000 }).length
    if (errorsAfter > errorsBefore) {
      const newErrors = errorMonitor.getErrors({ limit: 1000 }).slice(errorsBefore)
      const blueprintErrors = newErrors.filter(error =>
        this.isBlueprintRelatedError(error, blueprintId)
      )

      if (blueprintErrors.length > 0) {
        return {
          ...result,
          success: false,
          errors: blueprintErrors.map(error => ({
            type: error.type,
            message: error.args.join(' '),
            stack: error.stack,
            timestamp: error.timestamp,
            critical: errorMonitor.isCriticalError(error.type, error.args),
            timeFromOperation: new Date(error.timestamp) - Date.now() + 1000
          })),
          errorCaptureWindow: '1000ms',
          totalErrorsCaptured: newErrors.length,
          blueprintRelatedErrors: blueprintErrors.length
        }
      }
    }

    return result
  }
}
