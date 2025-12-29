import { createPlayerProxy } from '../../extras/createPlayerProxy.js'
import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'
import { ProxyBuilder } from '../../utils/ProxyBuilder.js'

const logger = new ComponentLogger('ProxyFactory')

export class ProxyFactory {
  constructor(app) {
    this.target = app
    this.app = app
    this.cachedProxy = null
    this.proxyMap = new Map()
    this.playerProxies = new Map()
  }

  getCachedProxy(key = 'default') {
    if (key === 'default' && this.cachedProxy) {
      return this.cachedProxy
    }
    return this.proxyMap.get(key)
  }

  createProxy(customProps = {}, cacheKey = null) {
    if (cacheKey && this.proxyMap.has(cacheKey)) {
      return this.proxyMap.get(cacheKey)
    }

    const builder = this.getBuilder()
    const proxy = builder.build(customProps)

    if (cacheKey) {
      this.proxyMap.set(cacheKey, proxy)
    } else if (cacheKey === null && !customProps) {
      this.cachedProxy = proxy
    }

    return proxy
  }

  getBuilder() {
    throw new Error('getBuilder() must be implemented by subclass')
  }

  clear() {
    this.cachedProxy = null
    this.proxyMap.clear()
    this.playerProxies.forEach(proxy => {
      proxy?.$cleanup?.()
    })
    this.playerProxies.clear()
  }

  destroy() {
    this.clear()
    this.target = null
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

}
