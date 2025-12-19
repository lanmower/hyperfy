export class MiddlewareRegistry {
  constructor() {
    this.middleware = []
    this.proxies = []
    this.monitors = []
  }

  use(middleware) {
    this.middleware.push(middleware)
  }

  monitor(monitorFn) {
    this.monitors.push(monitorFn)
  }

  addProxy(proxy) {
    this.proxies.push(proxy)
  }

  applyMiddleware(instance, world, options) {
    let current = instance
    for (const middlewareFn of this.middleware) {
      const wrapped = middlewareFn(current, world, options)
      if (wrapped) {
        current = wrapped
      }
    }
    return current
  }

  applyProxies(instance) {
    let current = instance
    for (const proxy of this.proxies) {
      current = proxy(current)
    }
    return current
  }

  hasMonitors() {
    return this.monitors.length > 0
  }

  getMonitors() {
    return this.monitors
  }
}
