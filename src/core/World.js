import EventEmitter from 'eventemitter3'
import { WorldConfig } from './config/SystemConfig.js'
import { StructuredLogger } from './utils/logging/index.js'
import { pluginRegistry, pluginHooks } from './plugins/index.js'
import { performanceMonitor, PerformanceBudget } from './performance/index.js'
import { memoryAnalyzer } from './memory/index.js'
import { eventAudit, eventRegistry } from './events/index.js'
import { WorldTickLoop } from './WorldTickLoop.js'
import { WorldSystemLifecycle } from './WorldSystemLifecycle.js'
import { WorldPluginManager } from './WorldPluginManager.js'

const logger = new StructuredLogger('World')

export class World extends EventEmitter {
  constructor() {
    super()

    this.logger = logger
    this.maxDeltaTime = WorldConfig.MAX_DELTA_TIME
    this.fixedDeltaTime = WorldConfig.FIXED_DELTA_TIME
    this.frame = 0
    this.time = 0
    this.accumulator = 0
    this.networkRate = 1 / 8
    this.assetsUrl = null
    this.assetsDir = null
    this.hot = new Set()

    this.pluginRegistry = pluginRegistry
    this.pluginHooks = pluginHooks
    this.initializeHooks()

    this.performanceMonitor = performanceMonitor
    this.performanceBudget = PerformanceBudget
    this.memoryAnalyzer = memoryAnalyzer
    this.eventAudit = eventAudit
    this.eventRegistry = eventRegistry

    this.rig = null
    this.camera = null

    this.tickLoop = new WorldTickLoop(this)
    this.systemLifecycle = new WorldSystemLifecycle(this)
    this.pluginManager = new WorldPluginManager(this)
  }

  register(key, System) {
    const system = new System(this)
    this[key] = system
    this.tickLoop.registerSystem(system)
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
    return this.pluginManager.initializePlugins(pluginList)
  }


  async init(options = {}) {
    this.storage = options.storage
    this.assetsDir = options.assetsDir
    this.assetsUrl = options.assetsUrl
    logger.info('World.init() called', { assetsUrl: this.assetsUrl, assetsDir: this.assetsDir })

    if (options.plugins) {
      logger.info('Initializing plugins...')
      await this.initializePlugins(options.plugins)
      logger.info('Plugins initialized')
    }

    logger.info('About to execute world:init hook')
    try {
      await this.pluginHooks.execute('world:init', this)
      logger.info('world:init hook executed successfully')
    } catch (err) {
      logger.error('world:init hook failed', { error: err.message })
      throw err
    }

    logger.info('About to initialize systems')
    try {
      await this.systemLifecycle.initializeSystems(options)
      logger.info('Systems initialized successfully')
    } catch (err) {
      logger.error('initializeSystems failed', { error: err.message })
      throw err
    }

    logger.info('Systems initialized, about to start systems')
    try {
      await this.systemLifecycle.startSystems()
      logger.info('Systems started successfully')
    } catch (err) {
      logger.error('startSystems failed', { error: err.message, stack: err.stack })
      throw err
    }
    logger.info('About to execute world:start hook')
    await this.pluginHooks.execute('world:start', this)
    logger.info('World.init complete')
  }

  tick = time => this.tickLoop.tick(time)
  preTick = () => this.tickLoop.preTick()
  preFixedUpdate = willFixedStep => this.tickLoop.preFixedUpdate(willFixedStep)
  fixedUpdate = delta => this.tickLoop.fixedUpdate(delta)
  postFixedUpdate = delta => this.tickLoop.postFixedUpdate(delta)
  preUpdate = alpha => this.tickLoop.preUpdate(alpha)
  update = delta => this.tickLoop.update(delta)
  postUpdate = delta => this.tickLoop.postUpdate(delta)
  lateUpdate = delta => this.tickLoop.lateUpdate(delta)
  postLateUpdate = delta => this.tickLoop.postLateUpdate(delta)
  commit = () => this.tickLoop.commit()
  postTick = () => this.tickLoop.postTick()
  invokeSystemLifecycle = (method, ...args) => this.tickLoop.invokeSystemLifecycle(method, ...args)
  invokeHotLifecycle = (method, ...args) => this.tickLoop.invokeHotLifecycle(method, ...args)

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
      const assetPath = url.slice(8)
      if (this.assetsDir && allowLocal) {
        return this.assetsDir + '/' + assetPath
      } else if (this.assetsUrl) {
        return this.assetsUrl + '/' + assetPath
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

  getPlugin = name => this.pluginManager.getPlugin(name)
  listPlugins = () => this.pluginManager.listPlugins()
  getPluginStats = () => this.pluginManager.getPluginStats()
  isPluginLoaded = name => this.pluginManager.isPluginLoaded(name)
  getPluginAPI = name => this.pluginManager.getPluginAPI(name)
  getAllHooks = () => this.pluginManager.getAllHooks()
  getHookCount = name => this.pluginManager.getHookCount(name)
  loadDefaultPlugins = () => this.pluginManager.loadDefaultPlugins()
  isPluginEnabled = name => this.pluginManager.isPluginEnabled(name)
  enablePlugin = name => this.pluginManager.enablePlugin(name)
  disablePlugin = name => this.pluginManager.disablePlugin(name)

  destroy() {
    this.pluginHooks.execute('world:destroy', this)
    this.pluginRegistry.getAllPlugins().forEach(plugin => {
      this.pluginRegistry.unregister(plugin.name)
    })
    this.systemLifecycle.destroySystems()
  }
}
