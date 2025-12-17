import { createPlayerProxy } from '../../extras/createPlayerProxy.js'

export class ProxyFactory {
  constructor(app) {
    this.app = app
  }

  getPlayerProxy(playerId) {
    const app = this.app
    if (playerId === undefined) playerId = app.world.entities.player?.data.id
    let proxy = app.playerProxies.get(playerId)
    if (!proxy || proxy.destroyed) {
      const player = app.world.entities.getPlayer(playerId)
      if (!player) return null
      proxy = createPlayerProxy(app, player)
      app.playerProxies.set(playerId, proxy)
    }
    return proxy
  }

  getWorldProxy() {
    const app = this.app
    if (!app.worldProxy) {
      const entity = app
      const getters = app.world.apps.worldGetters
      const setters = app.world.apps.worldSetters
      const methods = app.world.apps.worldMethods
      app.worldProxy = new Proxy(
        {},
        {
          get: (target, prop) => {
            if (prop in getters) {
              return getters[prop](entity)
            }
            if (prop in methods) {
              const method = methods[prop]
              return (...args) => {
                return method(entity, ...args)
              }
            }
            return undefined
          },
          set: (target, prop, value) => {
            if (prop in setters) {
              setters[prop](entity, value)
              return true
            }
            return true
          },
        }
      )
    }
    return app.worldProxy
  }

  getAppProxy() {
    const app = this.app
    if (!app.appProxy) {
      const entity = app
      const getters = app.world.apps.appGetters
      const setters = app.world.apps.appSetters
      const methods = app.world.apps.appMethods
      app.appProxy = new Proxy(
        {},
        {
          get: (target, prop) => {
            if (prop in getters) {
              return getters[prop](entity)
            }
            if (prop in methods) {
              const method = methods[prop]
              return (...args) => {
                return method(entity, ...args)
              }
            }
            return entity.root.getProxy()[prop]
          },
          set: (target, prop, value) => {
            if (prop in setters) {
              setters[prop](entity, value)
              return true
            }
            if (prop in entity.root.getProxy()) {
              entity.root.getProxy()[prop] = value
              return true
            }
            return true
          },
        }
      )
    }
    return app.appProxy
  }
}
