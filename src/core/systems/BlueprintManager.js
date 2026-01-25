import { isEqual } from '../utils/helpers/typeChecks.js'
import { System } from './System.js'
import { BlueprintValidator } from './BlueprintValidator.js'
import { BlueprintCache } from './BlueprintCache.js'
import { BlueprintResourceLoader } from './BlueprintResourceLoader.js'
import { BlueprintOrchestrator } from './BlueprintOrchestrator.js'

export class BlueprintManager extends System {
  static DEPS = {
    network: 'network',
    errors: 'errors',
    entities: 'entities',
    events: 'events',
  }

  constructor(world) {
    super(world)
    this.logger = this.world.logger || { info: () => {}, warn: () => {}, error: () => {} }
    this.validator = new BlueprintValidator(this.logger)
    this.cache = new BlueprintCache(this.logger)
    this.resourceLoader = new BlueprintResourceLoader(this.logger)
    this.orchestrator = new BlueprintOrchestrator(this.logger, this.resourceLoader)
  }

  get items() {
    return this.cache.items
  }

  async initInternal() {
  }

  get(id) {
    return this.cache.getFromCache(id)
  }

  getScene() {
    return this.cache.getFromCache('$scene')
  }

  async add(data, local) {
    if (data.script) {
      this.validator.validateScript(data.script, data.id)
    }

    if (data.props) {
      this.validator.validateProperties(data.props, data.id)
    }

    const normalized = this.normalize(data)
    this.validate(normalized)
    this.store(normalized)

    if (local) {
      this.network.send('blueprintAdded', { ...normalized, success: true })
    }
  }

  async modify(data) {
    if (data.script) {
      this.validator.validateScript(data.script, data.id)
    }

    if (data.props) {
      this.validator.validateProperties(data.props, data.id)
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
    return this.validator.validate(data)
  }

  normalize(data) {
    return this.validator.normalize(data)
  }

  store(normalizedData) {
    if (!this.cache.items) {
      this.logger.error('Blueprint storage not initialized')
      return false
    }

    this.cache.addToCache(normalizedData.id, normalizedData)
    return true
  }

  clear() {
    this.cache.clearCache()
  }

  serialize() {
    return this.cache.serialize()
  }

  deserialize(datas) {
    if (!Array.isArray(datas)) {
      this.logger.error('Invalid blueprint data format', { type: typeof datas })
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
        this.logger.error('Blueprint deserialization failed', {
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
      this.logger.error('Single blueprint deserialization failed', {
        blueprintId: data.id,
        error: error.message,
      })
      throw error
    }
  }

  async loadBlueprint(app, crashed) {
    return this.orchestrator.loadBlueprint(app, crashed, id => this.get(id))
  }

  async loadModel(app, modelUrl) {
    return this.resourceLoader.loadModel(app, modelUrl)
  }

  async loadScript(app, scriptUrl) {
    return this.resourceLoader.loadScript(app, scriptUrl)
  }

  async destroyInternal() {
    this.cache.clearAllCaches()
  }
}
