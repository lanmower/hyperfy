export class AppRegistry {
  constructor(worldGetters, worldSetters, worldMethods, appGetters, appSetters, appMethods) {
    this.worldGetters = worldGetters
    this.worldSetters = worldSetters
    this.worldMethods = worldMethods
    this.appGetters = appGetters
    this.appSetters = appSetters
    this.appMethods = appMethods
  }

  registerWorld(key, value) {
    const isFunc = typeof value === 'function'
    if (isFunc) {
      this.worldMethods[key] = value
      return
    }
    if (value.get) {
      this.worldGetters[key] = value.get
    }
    if (value.set) {
      this.worldSetters[key] = value.set
    }
  }

  registerApp(key, value) {
    const isFunc = typeof value === 'function'
    if (isFunc) {
      this.appMethods[key] = value
      return
    }
    if (value.get) {
      this.appGetters[key] = value.get
    }
    if (value.set) {
      this.appSetters[key] = value.set
    }
  }
}
