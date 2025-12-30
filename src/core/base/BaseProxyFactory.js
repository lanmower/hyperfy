import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('BaseProxyFactory')

export class BaseProxyFactory {
  constructor(target) {
    this.target = target
    this.cachedProxy = null
    this.proxyMap = new Map()
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
    this.onClear?.()
  }

  destroy() {
    this.clear()
    this.target = null
  }
}
