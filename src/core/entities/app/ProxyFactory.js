import { createPlayerProxy } from '../../extras/createPlayerProxy.js'

export class ProxyFactory {
  constructor(app) {
    this.app = app
    this.worldProxy = null
    this.appProxy = null
    this.playerProxies = new Map()
  }

  getWorldProxy() {
    if (!this.worldProxy) {
      this.worldProxy = this.createWorldProxy()
    }
    return this.worldProxy
  }

  getAppProxy() {
    if (!this.appProxy) {
      this.appProxy = this.createAppProxy()
    }
    return this.appProxy
  }

  getPlayerProxy(playerId) {
    let proxy = this.playerProxies.get(playerId)
    if (!proxy) {
      const player = this.app.world.entities.get(playerId)
      if (!player) return null
      proxy = createPlayerProxy(this.app, player)
      this.playerProxies.set(playerId, proxy)
    }
    return proxy
  }

  createWorldProxy() {
    const apps = this.app.world.apps
    const entity = this.app
    const proxy = {}

    for (const key in apps.worldGetters) {
      Object.defineProperty(proxy, key, {
        get: () => apps.worldGetters[key](entity),
        enumerable: true,
      })
    }

    for (const key in apps.worldSetters) {
      Object.defineProperty(proxy, key, {
        set: (value) => apps.worldSetters[key](entity, value),
        enumerable: true,
      })
    }

    for (const key in apps.worldMethods) {
      proxy[key] = (...args) => apps.worldMethods[key](entity, ...args)
    }

    return proxy
  }

  createAppProxy() {
    const apps = this.app.world.apps
    const entity = this.app
    const proxy = {}

    for (const key in apps.appGetters) {
      Object.defineProperty(proxy, key, {
        get: () => apps.appGetters[key](entity),
        enumerable: true,
      })
    }

    for (const key in apps.appSetters) {
      Object.defineProperty(proxy, key, {
        set: (value) => apps.appSetters[key](entity, value),
        enumerable: true,
      })
    }

    for (const key in apps.appMethods) {
      proxy[key] = (...args) => apps.appMethods[key](entity, ...args)
    }

    return proxy
  }

  clear() {
    this.worldProxy = null
    this.appProxy = null
    this.playerProxies.forEach(proxy => {
      proxy?.$cleanup?.()
    })
    this.playerProxies.clear()
  }
}
