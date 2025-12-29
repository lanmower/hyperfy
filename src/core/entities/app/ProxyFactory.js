import { createPlayerProxy } from '../../extras/createPlayerProxy.js'
import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'
import { UnifiedProxyFactory } from '../../utils/factories/UnifiedProxyFactory.js'

const logger = new ComponentLogger('ProxyFactory')

export class ProxyFactory extends UnifiedProxyFactory {
  constructor(app) {
    super(app)
    this.app = app
    this.playerProxies = new Map()
  }

  getWorldProxy() {
    return this.getCachedProxy('world') || this.createAndCacheWorldProxy()
  }

  createAndCacheWorldProxy() {
    const proxy = this.createWorldProxy()
    this.proxyMap.set('world', proxy)
    return proxy
  }

  getAppProxy() {
    return this.getCachedProxy('app') || this.createAndCacheAppProxy()
  }

  createAndCacheAppProxy() {
    const proxy = this.createAppProxy()
    this.proxyMap.set('app', proxy)
    return proxy
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
      logger.warn('Apps system not available for world proxy', {})
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
        logger.warn('Failed to define property', { property: key, error: err.message })
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
      logger.warn('Apps system not available for app proxy', {})
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
        logger.warn('Failed to define property', { property: key, error: err.message })
      }
    }

    for (const key in apps.appMethods) {
      proxy[key] = (...args) => apps.appMethods[key](apps, entity, ...args)
    }

    return proxy
  }

  clear() {
    super.clear()
    this.playerProxies.forEach(proxy => {
      proxy?.$cleanup?.()
    })
    this.playerProxies.clear()
  }
}
