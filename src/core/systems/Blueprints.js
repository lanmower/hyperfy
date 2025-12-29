import { isEqual } from 'lodash-es'
import { System } from './System.js'
import { BlueprintParser } from './blueprints/BlueprintParser.js'
import { BlueprintErrorMonitor } from './blueprints/BlueprintErrorMonitor.js'
import { BlueprintDeserializer } from './blueprints/BlueprintDeserializer.js'
import { InputSanitizer } from '../security/InputSanitizer.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('Blueprints')

export class Blueprints extends System {
  static DEPS = {
    network: 'network',
    errorMonitor: 'errorMonitor',
    entities: 'entities',
    events: 'events',
  }

  constructor(world) {
    super(world)
    this.items = new Map()
    this.parser = new BlueprintParser(world, this)
    this.monitor = new BlueprintErrorMonitor(world, this)
    this.deserializer = new BlueprintDeserializer(this)
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

    this.parser.validate(data)
    const normalized = this.parser.normalize(data)
    this.parser.store(normalized)

    if (local) {
      const response = await this.monitor.executeWithErrorMonitoring(normalized.id, async () => {
        return { ...normalized, success: true }
      })
      this.network.send('blueprintAdded', response)
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

    const response = await this.monitor.executeWithErrorMonitoring(blueprint.id, async () => {
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
    return this.deserializer.deserialize(datas)
  }

  destroy() {
    this.items.clear()
  }
}
