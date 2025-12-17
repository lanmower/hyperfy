
import { Auto } from './Auto.js'
import { DynamicFactory } from './DynamicFactory.js'
import { Bootstrap } from './Bootstrap.js'

export class DynamicWorld {
  constructor(world, options = {}) {
    this.world = world
    this.options = options
    this.bootstrap = new Bootstrap('DynamicWorld')
    this.factory = new DynamicFactory()
  }

  async autoSystems(systemsPath, prefix = 'System') {
    const modules = await Auto.discover(systemsPath)
    const mapped = Auto.map(modules, prefix)
    
    for (const [name, module] of Object.entries(mapped)) {
      const System = module.default || module
      if (typeof System === 'function') {
        this.bootstrap.register(name, System)
      }
    }
    return this
  }

  async autoEntities(entitiesPath, prefix = '') {
    await this.factory.discover(entitiesPath, prefix)
    return this
  }

  registerSystem(name, System, deps = []) {
    this.bootstrap.register(name, System, deps)
    return this
  }

  registerEntity(name, Class, schema = null) {
    this.factory.register(name, Class, schema)
    return this
  }

  async init() {
    await this.bootstrap.init(this.world, this.options)
    this.world.factory = this.factory
    return this
  }

  async start() {
    const instances = new Map(
      Array.from(this.bootstrap.initialized).map(name => [
        name,
        this.world[name]
      ])
    )
    await this.bootstrap.start(this.world, instances)
    return this
  }

  createEntity(type, data = {}) {
    return this.factory.create(type, data)
  }

  async destroy() {
    const instances = new Map(
      Array.from(this.bootstrap.initialized).map(name => [
        name,
        this.world[name]
      ])
    )
    await this.bootstrap.destroy(instances)
    return this
  }

  toString() {
    const typeCount = this.factory.types().length
    return `DynamicWorld(${this.bootstrap.services.size} systems, ${typeCount} types)`
  }
}
