import { isEqual } from 'lodash-es'
import { System } from './System.js'
import { BlueprintParser } from './blueprints/BlueprintParser.js'
import { BlueprintErrorMonitor } from './blueprints/BlueprintErrorMonitor.js'

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
  }

  get(id) {
    return this.items.get(id)
  }

  getScene() {
    return this.items.get('$scene')
  }

  async add(data, local) {
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
    for (const data of datas) {
      this.add(data)
    }
  }

  destroy() {
    this.items.clear()
  }
}
