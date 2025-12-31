import { isEqual } from 'lodash-es'
import { System } from './System.js'
import { InputSanitizer } from '../security/InputSanitizer.js'
import { AppValidator } from '../validators/AppValidator.js'
import { StructuredLogger } from '../utils/logging/index.js'
import { tracer } from '../utils/tracing/index.js'
import { PerformanceMetrics } from '../utils/metrics/PerformanceMetrics.js'

const logger = new StructuredLogger('BlueprintManager')

export class BlueprintManager extends System {
  static DEPS = {
    network: 'network',
    errors: 'errors',
    entities: 'entities',
    events: 'events',
  }

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
    if (data.script) {
      const scriptValidation = InputSanitizer.validateScript(data.script)
      if (!scriptValidation.valid) {
        logger.warn('Script validation failed for blueprint', {
          blueprintId: data.id,
          violationCount: scriptValidation.violations.length,
          violations: scriptValidation.violations,
        })
      }
    }

    if (data.props) {
      const propsValidation = InputSanitizer.validateProperties(data.props)
      if (!propsValidation.valid) {
        logger.warn('Properties validation failed for blueprint', {
          blueprintId: data.id,
          violationCount: propsValidation.violations.length,
          violations: propsValidation.violations,
        })
      }
    }

    const normalized = this.normalize(data); this.validate(normalized)
    this.store(normalized)

    if (local) {
      this.network.send('blueprintAdded', { ...normalized, success: true })
    }
  }

  async modify(data) {
    if (data.script) {
      const scriptValidation = InputSanitizer.validateScript(data.script)
      if (!scriptValidation.valid) {
        logger.warn('Script validation failed for blueprint modification', {
          blueprintId: data.id,
          violationCount: scriptValidation.violations.length,
          violations: scriptValidation.violations,
        })
      }
    }

    if (data.props) {
      const propsValidation = InputSanitizer.validateProperties(data.props)
      if (!propsValidation.valid) {
        logger.warn('Properties validation failed for blueprint modification', {
          blueprintId: data.id,
          violationCount: propsValidation.violations.length,
          violations: propsValidation.violations,
        })
      }
    }

    const blueprint = this.items.get(data.id)
    const modified = {
      ...blueprint,
      ...data,
    }
    const changed = !isEqual(blueprint, modified)
    if (!changed) return
    this.items.set(blueprint.id, modified)

    for (const [_, entity] of this.entities.items) {
      if (entity.data.blueprint === blueprint.id) {
        entity.data.state = {}
        entity.build()
      }
    }

    this.network.send('blueprintModified', { ...modified, success: true })
    this.events.emit('blueprintModified', modified)
  }

  validate(data) {
    const validation = AppValidator.validateBlueprint(data)
    if (!validation.valid) {
      throw new Error(`Blueprint validation failed: ${validation.error}`)
    }
    return data
  }

  normalize(data) {
    return AppValidator.normalizeBlueprint(data)
  }

  store(normalizedData) {
    if (!this.items) {
      logger.error('Blueprint storage not initialized')
      return false
    }

    this.items.set(normalizedData.id, normalizedData)
    return true
  }

  clear() {
    this.items.clear()
  }

  serialize() {
    const datas = []
    this.items.forEach(data => {
      datas.push(data)
    })
    return datas
  }

  deserialize(datas) {
    if (!Array.isArray(datas)) {
      logger.error('Invalid blueprint data format', { type: typeof datas })
      return []
    }

    const deserialized = []
    for (const data of datas) {
      try {
        const result = this.deserializeOne(data)
        if (result) {
          deserialized.push(result)
        }
      } catch (error) {
        logger.error('Blueprint deserialization failed', {
          blueprintId: data?.id,
          error: error.message
        })
      }
    }

    return deserialized
  }

  deserializeOne(data) {
    if (!data) return null

    try {
      const validated = this.validate(data)
      const normalized = this.normalize(validated)
      this.store(normalized)
      return normalized
    } catch (error) {
      logger.error('Single blueprint deserialization failed', {
        blueprintId: data.id,
        error: error.message,
      })
      throw error
    }
  }

  async loadBlueprint(app, crashed) {
    const world = app.world
    const blueprintId = app.data.blueprint
    const startTime = performance.now()

    return tracer.traceAsync(`blueprint_load[${blueprintId}]`, async span => {
      span?.setAttribute('blueprintId', blueprintId)
      span?.setAttribute('crashed', crashed)

      if (!blueprintId) {
        return null
      }

      const blueprintData = this.get(blueprintId)
      if (!blueprintData) {
        logger.warn('Blueprint not found', { blueprintId })
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
          const modelResult = await this.loadModel(app, blueprintData.model)
          root = modelResult?.nodes
          scene = modelResult?.scene
        }

        if (blueprintData.script && !crashed) {
          script = await this.loadScript(app, blueprintData.script)
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
        PerformanceMetrics.recordError('error', 'BlueprintManager')
        span?.setAttribute('status', 'error')
        span?.setAttribute('error', err.message)
        span?.setAttribute('duration', duration)
        return null
      }
    })
  }

  async loadModel(app, modelUrl) {
    const startTime = performance.now()
    return tracer.traceAsync(`model_load[${modelUrl}]`, async span => {
      span?.setAttribute('modelUrl', modelUrl)

      try {
        const world = app.world
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
        PerformanceMetrics.recordError('error', 'BlueprintManager.loadScript')
        span?.setAttribute('status', 'error')
        span?.setAttribute('error', err.message)
        span?.setAttribute('duration', duration)
        return null
      }
    })
  }

  destroy() {
    this.items.clear()
  }
}
