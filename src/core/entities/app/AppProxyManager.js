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
    const apps = this.app.world.apps
    const proxy = {}
    if (!apps) return proxy
    const allKeys = new Set([...Object.keys(apps.worldGetters || {}), ...Object.keys(apps.worldSetters || {})])
    for (const key of allKeys) {
      try {
        const descriptor = { enumerable: true, configurable: true }
        if (apps.worldGetters?.[key]) descriptor.get = () => apps.worldGetters[key](apps, this.app)
        if (apps.worldSetters?.[key]) descriptor.set = (value) => apps.worldSetters[key](apps, this.app, value)
        Object.defineProperty(proxy, key, descriptor)
      } catch (err) {
        logger.warn('Failed to define property', { property: key, error: err.message })
      }
    }
    for (const key in apps.worldMethods) {
      proxy[key] = (...args) => apps.worldMethods[key](apps, this.app, ...args)
    }
    this.proxyRegistry.cache.set('world', proxy)
    return proxy
  }

  getAppProxy() {
    const cached = this.proxyRegistry.getProxy('app')
    if (cached) return cached
    const apps = this.app.world.apps
    const proxy = {}
    if (!apps) return proxy
    const allKeys = new Set([...Object.keys(apps.appGetters || {}), ...Object.keys(apps.appSetters || {})])
    for (const key of allKeys) {
      try {
        const descriptor = { enumerable: true, configurable: true }
        if (apps.appGetters?.[key]) descriptor.get = () => apps.appGetters[key](apps, this.app)
        if (apps.appSetters?.[key]) descriptor.set = (value) => apps.appSetters[key](apps, this.app, value)
        Object.defineProperty(proxy, key, descriptor)
      } catch (err) {
        logger.warn('Failed to define property', { property: key, error: err.message })
      }
    }
    for (const key in apps.appMethods) {
      proxy[key] = (...args) => apps.appMethods[key](apps, this.app, ...args)
    }
    this.proxyRegistry.cache.set('app', proxy)
    return proxy
  }

  cleanup() {
    this.proxyRegistry.clear()
  }
}
