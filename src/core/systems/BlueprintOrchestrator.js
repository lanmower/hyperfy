import { tracer } from '../utils/tracing/index.js'
import { PerformanceMetrics } from '../utils/metrics/PerformanceMetrics.js'

export class BlueprintOrchestrator {
  constructor(logger, resourceLoader) {
    this.logger = logger || { info: () => {}, warn: () => {}, error: () => {} }
    this.resourceLoader = resourceLoader
  }

  async loadBlueprint(app, crashed, get) {
    const world = app.world
    const blueprintId = app.data.blueprint
    const startTime = performance.now()

    return tracer.traceAsync(`blueprint_load[${blueprintId}]`, async span => {
      span?.setAttribute('blueprintId', blueprintId)
      span?.setAttribute('crashed', crashed)

      if (!blueprintId) {
        return null
      }

      const blueprintData = get(blueprintId)
      if (!blueprintData) {
        this.logger.warn('Blueprint not found', { blueprintId })
        span?.setAttribute('status', 'not_found')
        return null
      }

      span?.setAttribute('hasModel', !!blueprintData.model)
      span?.setAttribute('hasScript', !!blueprintData.script)

      app.blueprint = blueprintData

      try {
        let root = null
        let scene = null
        let script = null

        if (blueprintData.model && !crashed) {
          const modelResult = await this.resourceLoader.loadModel(app, blueprintData.model)
          root = modelResult?.nodes
          scene = modelResult?.scene
        }

        if (blueprintData.script && !crashed) {
          script = await this.resourceLoader.loadScript(app, blueprintData.script)
        }

        const duration = performance.now() - startTime
        PerformanceMetrics.recordBlueprintLoad(duration, !!blueprintData.model, !!blueprintData.script)

        span?.setAttribute('status', 'success')
        span?.setAttribute('duration', duration)
        return {
          root,
          scene,
          script,
          blueprint: blueprintData,
        }
      } catch (err) {
        this.logger.error('Failed to load blueprint', { blueprintId, error: err.message })
        const duration = performance.now() - startTime
        PerformanceMetrics.recordError('error', 'BlueprintManager')
        span?.setAttribute('status', 'error')
        span?.setAttribute('error', err.message)
        span?.setAttribute('duration', duration)
        return null
      }
    })
  }
}
