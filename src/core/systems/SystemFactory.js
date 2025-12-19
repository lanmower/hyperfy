import { MiddlewareRegistry } from './factory/MiddlewareRegistry.js'
import { MonitorWrapper } from './factory/MonitorWrapper.js'
import { StandardMiddlewares } from './factory/StandardMiddlewares.js'

export class SystemFactory {
  constructor() {
    this.registry = new MiddlewareRegistry()
  }

  use(middleware) {
    this.registry.use(middleware)
    return this
  }

  monitor(monitorFn) {
    this.registry.monitor(monitorFn)
    return this
  }

  addProxy(proxy) {
    this.registry.addProxy(proxy)
    return this
  }

  create(SystemClass, world, options = {}) {
    let instance = new SystemClass(world)

    instance = this.registry.applyMiddleware(instance, world, options)

    if (this.registry.hasMonitors()) {
      instance = MonitorWrapper.wrap(instance, this.registry.getMonitors())
    }

    instance = this.registry.applyProxies(instance)

    return instance
  }

  static createLoggerMiddleware(verbose = false) {
    return StandardMiddlewares.createLoggerMiddleware(verbose)
  }

  static createErrorBoundaryMiddleware() {
    return StandardMiddlewares.createErrorBoundaryMiddleware()
  }

  static createConditionalMiddleware(condition) {
    return StandardMiddlewares.createConditionalMiddleware(condition)
  }
}

export function createDefaultSystemFactory(options = {}) {
  const factory = new SystemFactory()

  factory.use(SystemFactory.createErrorBoundaryMiddleware())

  if (options.verbose) {
    factory.use(SystemFactory.createLoggerMiddleware(true))
  }

  return factory
}
