import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'
import { tracer } from '../../utils/tracing/index.js'
import { PerformanceMetrics } from '../../utils/metrics/PerformanceMetrics.js'

const logger = new ComponentLogger('BlueprintLoader')

export class BlueprintLoader {
  constructor(app) {
    this.app = app
    this.blueprint = null
  }

  async load(crashed) {
    const world = this.app.world
    const blueprintId = this.app.data.blueprint
    const startTime = performance.now()

    return tracer.traceAsync(`blueprint_load[${blueprintId}]`, async span => {
      span?.setAttribute('blueprintId', blueprintId)
      span?.setAttribute('crashed', crashed)

      if (!blueprintId) {
        return null
      }

      const blueprintData = world.blueprints.get(blueprintId)
      if (!blueprintData) {
        logger.warn('Blueprint not found', { blueprintId })
        span?.setAttribute('status', 'not_found')
        return null
      }

      span?.setAttribute('hasModel', !!blueprintData.model)
      span?.setAttribute('hasScript', !!blueprintData.script)

      this.app.blueprint = blueprintData

      try {
        let root = null
        let scene = null
        let script = null

        if (blueprintData.model && !crashed) {
          const modelResult = await this.loadModel(blueprintData.model)
          root = modelResult?.nodes
          scene = modelResult?.scene
        }

        if (blueprintData.script && !crashed) {
          script = await this.loadScript(blueprintData.script)
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
        logger.error('Failed to load blueprint', { blueprintId, error: err.message })
        const duration = performance.now() - startTime
        PerformanceMetrics.recordError('error', 'BlueprintLoader')
        span?.setAttribute('status', 'error')
        span?.setAttribute('error', err.message)
        span?.setAttribute('duration', duration)
        return null
      }
    })
  }

  async loadModel(modelUrl) {
    const startTime = performance.now()
    return tracer.traceAsync(`model_load[${modelUrl}]`, async span => {
      span?.setAttribute('modelUrl', modelUrl)

      try {
        const world = this.app.world
        if (!world.loader) {
          logger.warn('Loader not available (server-side model loading not supported)')
          span?.setAttribute('status', 'loader_unavailable')
          PerformanceMetrics.recordResourceFail('model', 'loader_unavailable')
          return null
        }

        const type = modelUrl.endsWith('.vrm') ? 'avatar' : 'model'
        span?.setAttribute('type', type)

        const getSpan = tracer.startSpan(`model_get[${type}]`, span?.traceId)
        let glb = world.loader.get(type, modelUrl)
        const cached = !!glb
        tracer.endSpan(getSpan, glb ? 'ok' : 'not_cached')

        if (!glb) {
          const loadSpan = tracer.startSpan(`model_fetch[${type}]`, span?.traceId)
          glb = await world.loader.load(type, modelUrl)
          tracer.endSpan(loadSpan, glb ? 'ok' : 'error')
        }

        if (!glb) {
          logger.warn('Failed to load model', { modelUrl })
          span?.setAttribute('status', 'not_found')
          const duration = performance.now() - startTime
          PerformanceMetrics.recordResourceLoad(duration, type, modelUrl, false)
          PerformanceMetrics.recordResourceFail(type, 'not_found')
          return null
        }

        const duration = performance.now() - startTime
        PerformanceMetrics.recordResourceLoad(duration, type, modelUrl, cached)

        span?.setAttribute('status', 'success')
        span?.setAttribute('cached', cached)
        span?.setAttribute('duration', duration)
        return {
          nodes: glb.toNodes(),
          scene: glb.getScene?.(),
        }
      } catch (err) {
        logger.error('Error loading model', { modelUrl, error: err.message })
        const duration = performance.now() - startTime
        PerformanceMetrics.recordResourceFail('model', 'error')
        PerformanceMetrics.recordError('error', 'BlueprintLoader.loadModel')
        span?.setAttribute('status', 'error')
        span?.setAttribute('error', err.message)
        span?.setAttribute('duration', duration)
        return null
      }
    })
  }

  async loadScript(scriptUrl) {
    const startTime = performance.now()
    return tracer.traceAsync(`script_load[${scriptUrl}]`, async span => {
      span?.setAttribute('scriptUrl', scriptUrl)

      try {
        const world = this.app.world

        if (!world.loader) {
          logger.warn('Loader not available (server-side script loading not supported)')
          span?.setAttribute('status', 'loader_unavailable')
          PerformanceMetrics.recordResourceFail('script', 'loader_unavailable')
          return null
        }

        const getSpan = tracer.startSpan(`script_get`, span?.traceId)
        let scriptCode = world.loader.get('script', scriptUrl)
        const cached = !!scriptCode
        tracer.endSpan(getSpan, scriptCode ? 'ok' : 'not_cached')

        if (!scriptCode) {
          const fetchSpan = tracer.startSpan(`script_fetch`, span?.traceId)
          scriptCode = await world.loader.load('script', scriptUrl)
          tracer.endSpan(fetchSpan, scriptCode ? 'ok' : 'error')
        }

        if (!scriptCode) {
          logger.warn('Failed to load script', { scriptUrl })
          span?.setAttribute('status', 'not_found')
          const duration = performance.now() - startTime
          PerformanceMetrics.recordResourceLoad(duration, 'script', scriptUrl, false)
          PerformanceMetrics.recordResourceFail('script', 'not_found')
          return null
        }

        const duration = performance.now() - startTime
        PerformanceMetrics.recordResourceLoad(duration, 'script', scriptUrl, cached)

        span?.setAttribute('status', 'success')
        span?.setAttribute('codeLength', scriptCode.length)
        span?.setAttribute('cached', cached)
        span?.setAttribute('duration', duration)
        return scriptCode
      } catch (err) {
        logger.error('Error loading script', { scriptUrl, error: err.message })
        const duration = performance.now() - startTime
        PerformanceMetrics.recordResourceFail('script', 'error')
        PerformanceMetrics.recordError('error', 'BlueprintLoader.loadScript')
        span?.setAttribute('status', 'error')
        span?.setAttribute('error', err.message)
        span?.setAttribute('duration', duration)
        return null
      }
    })
  }
}
