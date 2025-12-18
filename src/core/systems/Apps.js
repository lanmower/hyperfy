import { isFunction } from 'lodash-es'

import { System } from './System.js'
import { WorldProxy } from './apps/WorldProxy.js'
import { AppProxy } from './apps/AppProxy.js'

export class Apps extends System {
  constructor(world) {
    super(world)
    const worldProxy = new WorldProxy(world)
    const appProxy = new AppProxy(world)

    this.worldGetters = worldProxy.getGetters()
    this.worldSetters = worldProxy.getSetters()
    this.worldMethods = worldProxy.getMethods()

    this.appGetters = appProxy.getGetters()
    this.appSetters = appProxy.getSetters()
    this.appMethods = appProxy.getMethods()
  }

  inject({ world, app }) {
    if (world) {
      for (const key in world) {
        const value = world[key]
        const isFunc = typeof value === 'function'
        if (isFunc) {
          this.worldMethods[key] = value
          continue
        }
        if (value.get) {
          this.worldGetters[key] = value.get
        }
        if (value.set) {
          this.worldSetters[key] = value.set
        }
      }
    }
    if (app) {
      for (const key in app) {
        const value = app[key]
        const isFunc = typeof value === 'function'
        if (isFunc) {
          this.appMethods[key] = value
          continue
        }
        if (value.get) {
          this.appGetters[key] = value.get
        }
        if (value.set) {
          this.appSetters[key] = value.set
        }
      }
    }
  }
}

export { fileRemaps } from './apps/fileRemaps.js'
