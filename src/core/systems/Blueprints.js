import { isEqual, merge } from 'lodash-es'
import { System } from './System.js'
import { ErrorPatterns } from '../utils/errorPatterns.js'

export class Blueprints extends System {
  constructor(world) {
    super(world)
    this.items = new Map()
  }

  get(id) {
    return this.items.get(id)
  }

  getScene() {
    return this.items.get('$scene')
  }

  async add(data, local) {
    this.items.set(data.id, data)
    if (local) {
      // Monitor for immediate errors and include them in the response
      const response = await this.executeWithErrorMonitoring(data.id, async () => {
        return { ...data, success: true }
      })
      this.world.network.send('blueprintAdded', response)
    }
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
    const errorMonitor = this.world.errorMonitor
    if (!errorMonitor) {
      // No error monitoring available, proceed normally
      return await operation()
    }

    // Capture ALL errors globally for 1 second to catch error chains
    // Error chains can propagate through async operations, model loading, 
    // script compilation, and other delayed processes
    const errorsBefore = errorMonitor.errors.length
    
    // Execute the operation
    const result = await operation()

    // Wait 1 full second to capture any error chains that might propagate
    // This catches:
    // - Immediate errors (0-100ms)
    // - Async operation errors (100-500ms) 
    // - Model loading chain errors (500ms-1s)
    // - Script compilation cascading errors (up to 1s)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Capture ALL new errors that occurred during this window
    const errorsAfter = errorMonitor.errors.length
    if (errorsAfter > errorsBefore) {
      const newErrors = errorMonitor.errors.slice(errorsBefore)
      
      // Since error chains can be complex, capture ALL errors during blueprint operations
      // The isBlueprintRelatedError method will return true for everything during this window
      const blueprintErrors = newErrors.filter(error => 
        this.isBlueprintRelatedError(error, blueprintId)
      )
      
      if (blueprintErrors.length > 0) {
        // Include ALL errors in the response for complete error chain visibility
        return {
          ...result,
          success: false,
          errors: blueprintErrors.map(error => ({
            type: error.type,
            message: error.args.join(' '),
            stack: error.stack,
            timestamp: error.timestamp,
            critical: errorMonitor.isCriticalError ? errorMonitor.isCriticalError(error.type, error.args) : true,
            // Add context about when this error occurred relative to blueprint operation
            timeFromOperation: new Date(error.timestamp) - Date.now() + 1000
          })),
          // Additional metadata about the error capture window
          errorCaptureWindow: '1000ms',
          totalErrorsCaptured: newErrors.length,
          blueprintRelatedErrors: blueprintErrors.length
        }
      }
    }
    
    return result
  }

  async modify(data) {
    const blueprint = this.items.get(data.id)
    const modified = {
      ...blueprint,
      ...data,
    }
    const changed = !isEqual(blueprint, modified)
    if (!changed) return
    this.items.set(blueprint.id, modified)
    
    // Monitor for immediate errors during blueprint modification and send response
    const response = await this.executeWithErrorMonitoring(blueprint.id, async () => {
      for (const [_, entity] of this.world.entities.items) {
        if (entity.data.blueprint === blueprint.id) {
          entity.data.state = {}
          entity.build()
        }
      }
      return { ...modified, success: true }
    })
    
    this.world.network.send('blueprintModified', response)
    this.emit('modify', modified)
  }

  serialize() {
    const datas = []
    this.items.forEach(data => {
      datas.push(data)
    })
    return datas
  }

  deserialize(datas) {
    for (const data of datas) {
      this.add(data)
    }
  }

  destroy() {
    this.items.clear()
  }
}
