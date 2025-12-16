// Service bootstrap - unified initialization and lifecycle management

export class Bootstrap {
  constructor(name = 'Bootstrap') {
    this.name = name
    this.services = new Map()
    this.initialized = new Set()
    this.dependencies = new Map()
  }

  register(name, Service, deps = []) {
    this.services.set(name, Service)
    this.dependencies.set(name, deps)
    return this
  }

  registerBatch(services) {
    for (const [name, config] of Object.entries(services)) {
      const { Service, deps = [] } = config
      this.register(name, Service, deps)
    }
    return this
  }

  async init(world, options = {}) {
    const instances = new Map()
    const sorted = this.#sortByDeps()

    for (const name of sorted) {
      const Service = this.services.get(name)
      try {
        const instance = new Service(world)
        instances.set(name, instance)
        world[name] = instance

        if (typeof instance.init === 'function') {
          await instance.init(options[name])
        }

        this.initialized.add(name)
      } catch (err) {
        console.error(`Failed to init ${name}:`, err)
        throw err
      }
    }

    return instances
  }

  async start(world, instances) {
    for (const [name, instance] of instances) {
      if (typeof instance.start === 'function') {
        try {
          await instance.start()
        } catch (err) {
          console.error(`Failed to start ${name}:`, err)
          throw err
        }
      }
    }
  }

  async destroy(instances) {
    const sorted = Array.from(this.initialized).reverse()
    for (const name of sorted) {
      const instance = instances.get(name)
      if (instance && typeof instance.destroy === 'function') {
        try {
          await instance.destroy()
          this.initialized.delete(name)
        } catch (err) {
          console.error(`Error destroying ${name}:`, err)
        }
      }
    }
  }

  #sortByDeps() {
    const visited = new Set()
    const result = []

    const visit = (name) => {
      if (visited.has(name)) return
      visited.add(name)

      const deps = this.dependencies.get(name) || []
      for (const dep of deps) {
        if (this.services.has(dep)) visit(dep)
      }

      result.push(name)
    }

    for (const name of this.services.keys()) {
      visit(name)
    }

    return result
  }

  toString() {
    return `${this.name}(${this.services.size} services, ${this.initialized.size} initialized)`
  }
}
