import { System } from './System.js'
import { WorldAPIConfig } from './apps/WorldAPIConfig.js'
import { AppAPIConfig } from './apps/AppAPIConfig.js'
import { AppRegistry } from './apps/AppRegistry.js'

export class Apps extends System {
  constructor(world) {
    super(world)
    this.raycastHit = null
    this.worldGetters = { ...WorldAPIConfig.getters }
    this.worldSetters = { ...WorldAPIConfig.setters }
    this.worldMethods = { ...WorldAPIConfig.methods }
    this.appGetters = { ...AppAPIConfig.getters }
    this.appSetters = { ...AppAPIConfig.setters }
    this.appMethods = { ...AppAPIConfig.methods }
    this.registry = new AppRegistry(
      this.worldGetters,
      this.worldSetters,
      this.worldMethods,
      this.appGetters,
      this.appSetters,
      this.appMethods
    )
  }

  inject({ world, app }) {
    if (world) {
      for (const key in world) {
        this.registry.registerWorld(key, world[key])
      }
    }
    if (app) {
      for (const key in app) {
        this.registry.registerApp(key, app[key])
      }
    }
  }
}

export { fileRemaps } from './apps/fileRemaps.js'
