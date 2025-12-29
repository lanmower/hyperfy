import * as THREE from './extras/three.js'
import EventEmitter from 'eventemitter3'
import { ServiceContainer } from './di/ServiceContainer.js'
import { ServiceLocator } from './di/ServiceLocator.js'
import { SystemRegistry as SystemRegistryImpl } from './di/SystemRegistry.js'
import { systemRegistry } from './systems/SystemRegistry.js'
import { WorldConfig } from './config/SystemConfig.js'
import { ComponentLogger } from './utils/logging/ComponentLogger.js'
import { pluginRegistry, pluginHooks, createPluginAPI } from './plugins/index.js'
import { performanceMonitor, PerformanceBudget } from './performance/index.js'
import { memoryAnalyzer } from './memory/index.js'
import { gracefulDegradation } from './systems/degradation/index.js'
import { performanceDashboard, MetricsCollector } from './monitoring/index.js'
import { eventAudit, eventRegistry } from './events/index.js'
import { LoadShedder, RateLimiter, QueueManager } from './systems/load-shedding/index.js'

const logger = new ComponentLogger('World')

export class World extends EventEmitter {
  constructor() {
    super()

    this.maxDeltaTime = WorldConfig.MAX_DELTA_TIME
    this.fixedDeltaTime = WorldConfig.FIXED_DELTA_TIME
    this.frame = 0
    this.time = 0
    this.accumulator = 0
    this.networkRate = 1 / 8
    this.assetsUrl = null
    this.assetsDir = null
    this.hot = new Set()

    this.di = new ServiceContainer()
    this.di.registerSingleton('world', this)

    this.systemRegistry = new SystemRegistryImpl()
    this.serviceLocator = new ServiceLocator(this.di)
    ServiceLocator.setGlobal(this.serviceLocator)

    this.pluginRegistry = pluginRegistry
    this.pluginHooks = pluginHooks
    this.initializeHooks()

    this.performanceMonitor = performanceMonitor
    this.performanceBudget = PerformanceBudget
    this.memoryAnalyzer = memoryAnalyzer
    this.degradation = gracefulDegradation
    this.dashboard = performanceDashboard
    this.metricsCollector = new MetricsCollector(this, performanceDashboard)
    this.eventAudit = eventAudit
    this.eventRegistry = eventRegistry

    this.loadShedder = new LoadShedder(this)
    this.rateLimiter = new RateLimiter(this)
    this.queueManager = new QueueManager(this)

    this.rig = new THREE.Object3D()
    this.camera = new THREE.PerspectiveCamera(70, 0, 0.2, 1200)
    this.rig.add(this.camera)

    this.loadSystemsFromRegistry()
  }

  loadSystemsFromRegistry() {
    const systems = systemRegistry.getCurrentPlatformSystems()
    for (const { name, class: SystemClass } of systems) {
      this.register(name, SystemClass)
    }
  }

  register(key, System) {
    const system = new System(this)
    this.systemRegistry.register(key, system)
    this.di.registerSingleton(key, system)
    this[key] = system
    return system
  }

  initializeHooks() {
    this.pluginHooks.register('world:init', 'before')
    this.pluginHooks.register('world:start', 'before')
    this.pluginHooks.register('world:update', 'action')
    this.pluginHooks.register('world:destroy', 'before')
    this.pluginHooks.register('entity:created', 'after')
    this.pluginHooks.register('entity:destroyed', 'before')
    this.pluginHooks.register('script:error', 'after')
    this.pluginHooks.register('asset:resolve', 'filter')
  }

  async initializePlugins(pluginList = []) {
    for (const pluginConfig of pluginList) {
      const { name, plugin } = pluginConfig
      if (!plugin) continue

      const api = createPluginAPI(this, name)
      plugin.api = api

      try {
        if (plugin.init) {
          await Promise.resolve(plugin.init(api))
        }
        this.pluginRegistry.register(name, plugin)
        logger.info('Plugin loaded', { name, version: plugin.version })
      } catch (error) {
        logger.error('Plugin initialization failed', { name, error: error.message })
      }
    }
  }

  getService(name) {
    return this.serviceLocator.get(name)
  }

  hasService(name) {
    return this.serviceLocator.has(name)
  }

  async init(options) {
    this.storage = options.storage
    this.assetsDir = options.assetsDir
    this.assetsUrl = options.assetsUrl

    if (options.plugins) {
      await this.initializePlugins(options.plugins)
    }

    await this.pluginHooks.execute('world:init', this)
    await this.systemRegistry.init(options)
    await this.start()
  }

  async start() {
    await this.pluginHooks.execute('world:start', this)
    await this.systemRegistry.start()
  }

  tick = time => {
    this.preTick()
    time /= 1000
    let delta = time - this.time
    if (delta < 0) delta = 0
    if (delta > this.maxDeltaTime) {
      delta = this.maxDeltaTime
    }
    this.frame++
    this.time = time
    this.accumulator += delta
    const willFixedStep = this.accumulator >= this.fixedDeltaTime
    this.preFixedUpdate(willFixedStep)
    while (this.accumulator >= this.fixedDeltaTime) {
      this.fixedUpdate(this.fixedDeltaTime)
      this.postFixedUpdate(this.fixedDeltaTime)
      this.accumulator -= this.fixedDeltaTime
    }
    const alpha = this.accumulator / this.fixedDeltaTime
    this.preUpdate(alpha)
    this.update(delta, alpha)
    this.postUpdate(delta)
    this.lateUpdate(delta, alpha)
    this.postLateUpdate(delta)
    this.commit()
    this.postTick()
  }

  preTick() {
    this.systemRegistry.preTick()
  }

  preFixedUpdate(willFixedStep) {
    this.systemRegistry.preFixedUpdate(willFixedStep)
  }

  fixedUpdate(delta) {
    for (const item of this.hot) {
      item.fixedUpdate?.(delta)
    }
    this.systemRegistry.fixedUpdate(delta)
  }

  postFixedUpdate(delta) {
    this.systemRegistry.postFixedUpdate(delta)
  }

  preUpdate(alpha) {
    this.systemRegistry.preUpdate(alpha)
  }

  update(delta) {
    for (const item of this.hot) {
      item.update?.(delta)
    }
    this.pluginHooks.execute('world:update', delta)

    const updateStart = performance.now()
    this.systemRegistry.update(delta)
    const updateDuration = performance.now() - updateStart

    if (this.frame % 30 === 0) {
      this.performanceMonitor.recordFramePhase('update', updateDuration)
    }
  }

  postUpdate(delta) {
    this.systemRegistry.postUpdate(delta)
  }

  lateUpdate(delta) {
    for (const item of this.hot) {
      item.lateUpdate?.(delta)
    }

    const lateUpdateStart = performance.now()
    this.systemRegistry.lateUpdate(delta)
    const lateUpdateDuration = performance.now() - lateUpdateStart

    if (this.frame % 30 === 0) {
      this.performanceMonitor.recordFramePhase('lateUpdate', lateUpdateDuration)
      this.performanceMonitor.recordEntityOperation('hot.lateUpdate', lateUpdateDuration, this.hot.size)
    }
  }

  postLateUpdate(delta) {
    for (const item of this.hot) {
      item.postLateUpdate?.(delta)
    }
    this.systemRegistry.postLateUpdate(delta)
  }

  commit() {
    this.systemRegistry.commit()
  }

  postTick() {
    this.systemRegistry.postTick()
  }

  setupMaterial = material => {
    this.environment.csm?.setupMaterial(material)
  }

  setHot(item, hot) {
    if (hot) {
      this.hot.add(item)
    } else {
      this.hot.delete(item)
    }
  }

  resolveURL(url, allowLocal) {
    if (!url) return url
    url = url.trim()
    if (url.startsWith('blob')) {
      return url
    }
    if (url.startsWith('asset://')) {
      if (this.assetsDir && allowLocal) {
        return url.replace('asset:/', this.assetsDir)
      } else if (this.assetsUrl) {
        return url.replace('asset:/', this.assetsUrl)
      } else {
        logger.error('resolveURL: no assetsUrl or assetsDir defined', { url })
        return url
      }
    }
    if (url.match(/^https?:\/\//i)) {
      return url
    }
    if (url.startsWith('//')) {
      return `https:${url}`
    }
    if (url.startsWith('/')) {
      return url
    }
    return `https://${url}`
  }

  inject(runtime) {
    this.apps.inject(runtime)
  }

  destroy() {
    this.pluginHooks.execute('world:destroy', this)
    this.pluginRegistry.getAllPlugins().forEach(plugin => {
      this.pluginRegistry.unregister(plugin.name)
    })
    this.systemRegistry.destroy()
  }
}
