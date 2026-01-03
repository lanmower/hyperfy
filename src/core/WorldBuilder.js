import { World } from './World.js'
import { StructuredLogger } from './utils/logging/index.js'

const logger = new StructuredLogger('WorldBuilder')

export class WorldBuilder {
  constructor() {
    this.world = new World()
    this.systemConfigs = []
    this.pluginList = []
    this.options = {}
  }

  addSystem(name, SystemClass, priority = 50) {
    this.systemConfigs.push({ name, class: SystemClass, priority })
    return this
  }

  addSystems(configs) {
    for (const config of configs) {
      if (config.class) {
        this.systemConfigs.push(config)
      }
    }
    return this
  }

  addPlugin(name, plugin) {
    this.pluginList.push({ name, plugin })
    return this
  }

  addPlugins(plugins) {
    this.pluginList.push(...plugins)
    return this
  }

  configure(options) {
    if (!options || typeof options !== 'object') return this
    for (const key in options) {
      if (options.hasOwnProperty(key) && !['__proto__', 'constructor', 'prototype'].includes(key)) {
        this.options[key] = options[key]
      }
    }
    return this
  }

  build() {
    this.systemConfigs.sort((a, b) => (b.priority || 50) - (a.priority || 50))
    this.registerSystems()
    return this.world
  }

  registerSystems() {
    for (const { name, class: SystemClass } of this.systemConfigs) {
      try {
        this.world.register(name, SystemClass)
      } catch (error) {
        logger.error(`Failed to register system: ${name}`, { error: error.message })
      }
    }
  }

  async initialize(initOptions = {}) {
    const options = { ...this.options, ...initOptions }
    await this.world.init(options)
    return this.world
  }

  getWorld() {
    return this.world
  }
}
