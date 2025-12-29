import { ProxyBuilder } from '../ProxyBuilder.js'
import { ComponentLogger } from '../logging/ComponentLogger.js'

const logger = new ComponentLogger('UnifiedProxyFactory')

export class UnifiedProxyFactory {
  constructor(target) {
    this.target = target
    this.cachedProxy = null
    this.proxyMap = new Map()
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

  getCachedProxy(key = 'default') {
    if (key === 'default' && this.cachedProxy) {
      return this.cachedProxy
    }
    return this.proxyMap.get(key)
  }

  getBuilder() {
    throw new Error('getBuilder() must be implemented by subclass')
  }

  clear() {
    this.cachedProxy = null
    this.proxyMap.clear()
  }

  getStats() {
    return {
      cached: !!this.cachedProxy,
      mapSize: this.proxyMap.size
    }
  }

  static createBuilderWithGettersSetters(target, spec) {
    const builder = new ProxyBuilder(target)
    const allKeys = new Set([...Object.keys(spec.getters || {}), ...Object.keys(spec.setters || {})])

    for (const key of allKeys) {
      try {
        const descriptor = {
          enumerable: true,
          configurable: true,
        }
        if (spec.getters?.[key]) {
          descriptor.get = spec.getters[key]
        }
        if (spec.setters?.[key]) {
          descriptor.set = spec.setters[key]
        }
        if (descriptor.get || descriptor.set) {
          builder.addProperty(key, descriptor.get, descriptor.set)
        }
      } catch (err) {
        logger.error('Failed to define property in builder', { key, error: err.message })
      }
    }

    if (spec.methods) {
      for (const key in spec.methods) {
        builder.addMethod(key, spec.methods[key])
      }
    }

    return builder
  }

  static createBuilderWithSpec(target, spec) {
    const builder = new ProxyBuilder(target)
    builder.addMultiple(spec)
    return builder
  }

  destroy() {
    this.clear()
    this.target = null
  }
}
