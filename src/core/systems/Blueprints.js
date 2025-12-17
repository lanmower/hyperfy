import { isEqual, merge } from 'lodash-es'
import { System } from './System.js'
import { ErrorPatterns } from '../utils/errorPatterns.js'
import { AppValidator } from '../validators/AppValidator.js'
import { normalizeBlueprint } from '../schemas/AppBlueprint.schema.js'

export class Blueprints extends System {
  constructor(world) {
    super(world)
    this.items = new Map()
  }

  /**
   * Get service from DI container (with fallback to this.world)
   */
  getService(name) {
    if (this.world.di?.has?.(name)) {
      return this.world.di.get(name)
    }
    return this.world[name]
  }

  /**
   * Shortcut accessors for commonly used services
   */
  get network() { return this.getService('network') }
  get errorMonitor() { return this.getService('errorMonitor') }
  get entities() { return this.getService('entities') }
  get events() { return this.getService('events') }

  get(id) {
    return this.items.get(id)
  }

  getScene() {
    return this.items.get('$scene')
  }

  async add(data, local) {
    const validation = AppValidator.validateBlueprint(data)
    if (!validation.valid) {
      console.warn(`Blueprint validation warning for ${data.id}:`, validation.error)
    }

    const normalized = normalizeBlueprint(data)
    this.items.set(normalized.id, normalized)

    if (local) {
      const response = await this.executeWithErrorMonitoring(normalized.id, async () => {
        return { ...normalized, success: true }
      })
      this.network.send('blueprintAdded', response)
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
    const errorMonitor = this.errorMonitor
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
      for (const [_, entity] of this.entities.items) {
        if (entity.data.blueprint === blueprint.id) {
          entity.data.state = {}
          entity.build()
        }
      }
      return { ...modified, success: true }
    })

    this.network.send('blueprintModified', response)
    this.events.emit('blueprintModified', modified)
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
