// Zero-config world initialization with automatic system discovery and registration

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

  // Discover and auto-register systems from directory
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

  // Discover and auto-register entity types
  async autoEntities(entitiesPath, prefix = '') {
    await this.factory.discover(entitiesPath, prefix)
    return this
  }

  // Manually register system
  registerSystem(name, System, deps = []) {
    this.bootstrap.register(name, System, deps)
    return this
  }

  // Manually register entity type
  registerEntity(name, Class, schema = null) {
    this.factory.register(name, Class, schema)
    return this
  }

  // Initialize all registered systems
  async init() {
    await this.bootstrap.init(this.world, this.options)
    this.world.factory = this.factory
    return this
  }

  // Start all registered systems
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

  // Create entity with factory
  createEntity(type, data = {}) {
    return this.factory.create(type, data)
  }

  // Cleanup and destroy
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
