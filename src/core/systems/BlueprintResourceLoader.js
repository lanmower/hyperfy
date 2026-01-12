import { tracer } from '../utils/tracing/index.js'
import { PerformanceMetrics } from '../utils/metrics/PerformanceMetrics.js'

export class BlueprintResourceLoader {
  constructor(logger) {
    this.logger = logger || { info: () => {}, warn: () => {}, error: () => {} }
  }

  async loadModel(app, modelUrl) {
    const startTime = performance.now()
    return tracer.traceAsync(`model_load[${modelUrl}]`, async span => {
      span?.setAttribute('modelUrl', modelUrl)

      try {
        const world = app.world
        if (!world.loader) {
          this.logger.warn('Loader not available (server-side model loading not supported)')
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
          this.logger.warn('Failed to load model', { modelUrl })
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
        this.logger.error('Error loading model', { modelUrl, error: err.message })
        const duration = performance.now() - startTime
        PerformanceMetrics.recordResourceFail('model', 'error')
        PerformanceMetrics.recordError('error', 'BlueprintManager.loadModel')
        span?.setAttribute('status', 'error')
        span?.setAttribute('error', err.message)
        span?.setAttribute('duration', duration)
        return null
      }
    })
  }

  async loadScript(app, scriptUrl) {
    const startTime = performance.now()
    return tracer.traceAsync(`script_load[${scriptUrl}]`, async span => {
      span?.setAttribute('scriptUrl', scriptUrl)

      try {
        const world = app.world

        if (!world.loader) {
          this.logger.warn('Loader not available (server-side script loading not supported)')
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
          this.logger.warn('Failed to load script', { scriptUrl })
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
        this.logger.error('Error loading script', { scriptUrl, error: err.message })
        const duration = performance.now() - startTime
        PerformanceMetrics.recordResourceFail('script', 'error')
        PerformanceMetrics.recordError('error', 'BlueprintManager.loadScript')
        span?.setAttribute('status', 'error')
        span?.setAttribute('error', err.message)
        span?.setAttribute('duration', duration)
        return null
      }
    })
  }
}
