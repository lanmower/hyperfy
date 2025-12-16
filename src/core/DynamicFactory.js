// Dynamic factory for creating objects without boilerplate using Auto discovery and Props system

import { Auto } from './Auto.js'
import { Props } from './Props.js'

export class DynamicFactory {
  constructor(discoveryPath = null) {
    this.discoveryPath = discoveryPath
    this.classes = new Map()
    this.factories = new Map()
  }

  // Register a class for dynamic creation
  register(name, Class, schema = null) {
    this.classes.set(name, { Class, schema })
    return this
  }

  // Register multiple classes at once
  registerBatch(classes) {
    for (const [name, config] of Object.entries(classes)) {
      const { Class, schema } = config
      this.register(name, Class, schema)
    }
    return this
  }

  // Register factory function for custom creation logic
  registerFactory(name, factory) {
    this.factories.set(name, factory)
    return this
  }

  // Auto-discover and register classes from directory
  async discover(path, prefix = '') {
    const modules = await Auto.discover(path)
    const mapped = Auto.map(modules, prefix)
    
    for (const [name, module] of Object.entries(mapped)) {
      const Class = module.default || module
      if (typeof Class === 'function') {
        this.register(name, Class)
      }
    }
    return this
  }

  // Create instance with automatic property initialization
  create(type, data = {}) {
    if (this.factories.has(type)) {
      return this.factories.get(type)(data)
    }

    const config = this.classes.get(type)
    if (!config) {
      throw new Error(`Unknown type: ${type}`)
    }

    const { Class, schema } = config
    const props = schema ? Props.validate(data, schema) : data
    return new Class(props)
  }

  // Create with fluent API
  createFluid(type) {
    return {
      with: (data) => this.create(type, data),
      get: () => this.create(type, {}),
    }
  }

  // Batch create multiple instances
  createBatch(type, dataArray) {
    return dataArray.map(data => this.create(type, data))
  }

  // Get registered types
  types() {
    return [
      ...this.classes.keys(),
      ...this.factories.keys(),
    ]
  }

  toString() {
    return `DynamicFactory(${this.classes.size} classes, ${this.factories.size} factories)`
  }
}
