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

    if (!apps) {
      console.warn('[ProxyFactory] Apps system not available, returning empty world proxy')
      return proxy
    }

    const allKeys = new Set([...Object.keys(apps.worldGetters || {}), ...Object.keys(apps.worldSetters || {})])

    for (const key of allKeys) {
      try {
        const descriptor = {
          enumerable: true,
          configurable: true,
        }
        if (apps.worldGetters?.[key]) {
          descriptor.get = () => apps.worldGetters[key](apps, entity)
        }
        if (apps.worldSetters?.[key]) {
          descriptor.set = (value) => apps.worldSetters[key](apps, entity, value)
        }
        Object.defineProperty(proxy, key, descriptor)
      } catch (err) {
        console.warn(`Failed to define property for ${key}:`, err.message)
      }
    }

    for (const key in apps.worldMethods) {
      proxy[key] = (...args) => apps.worldMethods[key](apps, entity, ...args)
    }

    return proxy
  }

  createAppProxy() {
    const apps = this.app.world.apps
    const entity = this.app
    const proxy = {}

    if (!apps) {
      console.warn('[ProxyFactory] Apps system not available, returning empty app proxy')
      return proxy
    }

    const allKeys = new Set([...Object.keys(apps.appGetters || {}), ...Object.keys(apps.appSetters || {})])

    for (const key of allKeys) {
      try {
        const descriptor = {
          enumerable: true,
          configurable: true,
        }
        if (apps.appGetters?.[key]) {
          descriptor.get = () => apps.appGetters[key](apps, entity)
        }
        if (apps.appSetters?.[key]) {
          descriptor.set = (value) => apps.appSetters[key](apps, entity, value)
        }
        Object.defineProperty(proxy, key, descriptor)
      } catch (err) {
        console.warn(`Failed to define property for ${key}:`, err.message)
      }
    }

    for (const key in apps.appMethods) {
      proxy[key] = (...args) => apps.appMethods[key](apps, entity, ...args)
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
