import { createPlayerProxy } from '../../extras/createPlayerProxy.js'
import { ProxyRegistry } from '../../proxy/ProxyRegistry.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('AppProxyManager')

export class AppProxyManager {
  constructor(app) {
    this.app = app
    this.proxyRegistry = new ProxyRegistry()
  }

  getPlayerProxy(playerId) {
    const cached = this.proxyRegistry.getProxy(playerId)
    if (cached) return cached
    const player = this.app.world.entities.get(playerId)
    if (!player) return null
    const proxy = createPlayerProxy(this.app, player)
    this.proxyRegistry.cache.set(playerId, proxy)
    return proxy
  }

  getWorldProxy() {
    const cached = this.proxyRegistry.getProxy('world')
    if (cached) return cached
    const proxy = new Proxy({}, {
      get: (target, key) => {
        const apps = this.app.world.apps
        if (!apps) return undefined
        if (apps.worldGetters?.[key]) {
          return apps.worldGetters[key](apps, this.app)
        }
        if (apps.worldMethods?.[key]) {
          return (...args) => apps.worldMethods[key](apps, this.app, ...args)
        }
        return target[key]
      },
      set: (target, key, value) => {
        const apps = this.app.world.apps
        if (!apps) return false
        if (apps.worldSetters?.[key]) {
          apps.worldSetters[key](apps, this.app, value)
          return true
        }
        target[key] = value
        return true
      },
      has: (target, key) => {
        const apps = this.app.world.apps
        if (!apps) return false
        return !!(apps.worldGetters?.[key] || apps.worldSetters?.[key] || apps.worldMethods?.[key])
      },
      ownKeys: (target) => {
        const apps = this.app.world.apps
        if (!apps) return []
        const keys = new Set([
          ...Object.keys(apps.worldGetters || {}),
          ...Object.keys(apps.worldSetters || {}),
          ...Object.keys(apps.worldMethods || {}),
        ])
        return Array.from(keys)
      },
      getOwnPropertyDescriptor: (target, key) => {
        const apps = this.app.world.apps
        if (!apps) return undefined
        if (apps.worldGetters?.[key] || apps.worldSetters?.[key] || apps.worldMethods?.[key]) {
          return { enumerable: true, configurable: true }
        }
        return undefined
      },
    })
    this.proxyRegistry.cache.set('world', proxy)
    return proxy
  }

  getAppProxy() {
    const cached = this.proxyRegistry.getProxy('app')
    if (cached) return cached
    const proxy = new Proxy({}, {
      get: (target, key) => {
        const apps = this.app.world.apps
        if (!apps) return undefined
        if (apps.appGetters?.[key]) {
          return apps.appGetters[key](apps, this.app)
        }
        if (apps.appMethods?.[key]) {
          return (...args) => apps.appMethods[key](apps, this.app, ...args)
        }
        return target[key]
      },
      set: (target, key, value) => {
        const apps = this.app.world.apps
        if (!apps) return false
        if (apps.appSetters?.[key]) {
          apps.appSetters[key](apps, this.app, value)
          return true
        }
        target[key] = value
        return true
      },
      has: (target, key) => {
        const apps = this.app.world.apps
        if (!apps) return false
        return !!(apps.appGetters?.[key] || apps.appSetters?.[key] || apps.appMethods?.[key])
      },
      ownKeys: (target) => {
        const apps = this.app.world.apps
        if (!apps) return []
        const keys = new Set([
          ...Object.keys(apps.appGetters || {}),
          ...Object.keys(apps.appSetters || {}),
          ...Object.keys(apps.appMethods || {}),
        ])
        return Array.from(keys)
      },
      getOwnPropertyDescriptor: (target, key) => {
        const apps = this.app.world.apps
        if (!apps) return undefined
        if (apps.appGetters?.[key] || apps.appSetters?.[key] || apps.appMethods?.[key]) {
          return { enumerable: true, configurable: true }
        }
        return undefined
      },
    })
    this.proxyRegistry.cache.set('app', proxy)
    return proxy
  }

  cleanup() {
    this.proxyRegistry.clear()
  }
}
