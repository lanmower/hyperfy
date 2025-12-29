let globalLocator = null

export class ServiceLocator {
  constructor(container) {
    this.container = container
  }

  get(name) {
    try {
      return this.container.get(name)
    } catch (err) {
      return null
    }
  }

  has(name) {
    return this.container.has(name)
  }

  register(name, service) {
    this.container.registerSingleton(name, service)
  }

  static setGlobal(locator) {
    globalLocator = locator
  }

  static getGlobal() {
    return globalLocator
  }

  static get(name) {
    return globalLocator?.get(name) ?? null
  }

  static has(name) {
    return globalLocator?.has(name) ?? false
  }
}
