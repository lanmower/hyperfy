import { ComponentLogger } from '../../core/utils/logging/ComponentLogger.js'
import { ConsoleCapture } from './ConsoleCapture.js'
import { ResourceTracker } from '../../core/debug/ResourceTracker.js'
import { dependencyValidator } from '../../core/di/DependencyValidator.js'
import { cleanupTracker, printCleanupGuide } from '../../core/lifecycle/index.js'

const logger = new ComponentLogger('DebugAPI')

export function setupDebugGlobals(world) {
  if (typeof window === 'undefined') return

  const consoleCapture = new ConsoleCapture(500)
  consoleCapture.enable()

  window.__DEBUG__ = {
    world,
    entities: () => Array.from(world.entities.items.values()),
    blueprints: () => Array.from(world.blueprints.items.entries()),
    apps: () => Array.from(world.entities.items.values()).filter(e => e.isApp),
    players: () => Array.from(world.entities.items.values()).filter(e => e.isPlayer),
    getEntity: (id) => world.entities.get(id),
    getBlueprint: (id) => world.blueprints.get(id),
    network: {
      id: () => world.network.id,
      isServer: () => world.network.isServer,
      isClient: () => world.network.isClient,
    },
    systems: {
      loader: () => world.loader,
      scripts: () => world.scripts,
      blueprints: () => world.blueprints,
      entities: () => world.entities,
      controls: () => world.controls,
      environment: () => world.environment,
      physics: () => world.physics,
      network: () => world.network,
      stage: () => world.stage,
    },
    logs: consoleCapture.logs,

    getAppByBlueprint: (blueprintName) => {
      const apps = Array.from(world.entities.items.values()).filter(e => e.isApp)
      return apps.find(app => {
        const bp = world.blueprints.get(app.data.blueprint)
        return bp?.name === blueprintName
      })
    },
    getAppState: (appId) => {
      const app = world.entities.get(appId)
      if (!app?.isApp) return null
      return {
        id: app.data.id,
        blueprint: world.blueprints.get(app.data.blueprint)?.name,
        mode: app.mode,
        childCount: app.root?.children?.length || 0,
        children: app.root?.children?.map(c => ({ name: c.name, type: c.constructor.name })) || [],
        scriptExecutor: app.scriptExecutor?.context ? 'active' : 'inactive',
      }
    },

    player: () => {
      const players = Array.from(world.entities.items.values()).filter(e => e.isPlayer)
      return players.find(p => p.isLocal) || players[0]
    },
    getPlayerState: (playerId) => {
      const player = world.entities.get(playerId)
      if (!player?.isPlayer) return null
      return {
        id: player.data.id,
        isLocal: player.isLocal,
        position: player.data.position,
        mode: player.data.mode,
        hasAvatar: player.avatar ? true : false,
        hasPhysics: player.physics ? true : false,
      }
    },
    playerState: () => {
      const player = window.__DEBUG__.player()
      if (!player) return { error: 'No player found' }
      return {
        id: player.data.id,
        isLocal: player.isLocal,
        position: { x: player.base.position.x, y: player.base.position.y, z: player.base.position.z },
        quaternion: { x: player.base.quaternion.x, y: player.base.quaternion.y, z: player.base.quaternion.z, w: player.base.quaternion.w },
        hasAvatar: !!player.avatar,
        avatarPosition: player.avatar ? { x: player.avatar.raw?.scene?.position.x, y: player.avatar.raw?.scene?.position.y, z: player.avatar.raw?.scene?.position.z } : null,
        hasPhysics: !!player.physics,
        moving: player.physics?.moving || false,
        grounded: player.physics?.grounded || false,
        jumping: player.physics?.jumping || false,
        falling: player.physics?.falling || false,
        flying: player.physics?.flying || false,
        animationMode: player.mode,
        hasControl: !!player.control,
        firstPerson: player.firstPerson || false,
        cameraZoom: player.control?.camera?.zoom || null,
        cameraDistance: player.control?.camera?.position.distanceTo(player.cam.position) || null,
      }
    },
    avatarHierarchy: () => {
      const player = window.__DEBUG__.player()
      if (!player) return { error: 'No player found' }
      return {
        basePosition: { x: player.base.position.x, y: player.base.position.y, z: player.base.position.z },
        baseQuaternion: { x: player.base.quaternion.x, y: player.base.quaternion.y, z: player.base.quaternion.z, w: player.base.quaternion.w },
        baseMatrixWorld: player.base.matrixWorld ? 'set' : 'unset',
        avatar: player.avatar ? {
          hasRaw: !!player.avatar.raw,
          rawScene: player.avatar.raw?.scene ? {
            position: { x: player.avatar.raw.scene.position.x, y: player.avatar.raw.scene.position.y, z: player.avatar.raw.scene.position.z },
            quaternion: { x: player.avatar.raw.scene.quaternion.x, y: player.avatar.raw.scene.quaternion.y, z: player.avatar.raw.scene.quaternion.z, w: player.avatar.raw.scene.quaternion.w },
            visible: player.avatar.raw.scene.visible,
            childCount: player.avatar.raw.scene.children?.length || 0,
            matrixWorld: player.avatar.raw.scene.matrixWorld ? 'set' : 'unset',
          } : null,
        } : null,
        baseParent: player.base.parent?.name || player.base.parent?.constructor.name || 'unknown',
        baseInScene: world.stage?.scene?.children.includes(player.base) || false,
      }
    },
    testMovement: (direction = 'forward', duration = 2000) => {
      const player = window.__DEBUG__.player()
      if (!player) return { error: 'No player found' }
      const startPos = { x: player.base.position.x, y: player.base.position.y, z: player.base.position.z }
      const startTime = Date.now()
      const handleTick = () => {
        const elapsed = Date.now() - startTime
        if (elapsed >= duration) {
          const endPos = { x: player.base.position.x, y: player.base.position.y, z: player.base.position.z }
          const distance = Math.sqrt(
            Math.pow(endPos.x - startPos.x, 2) +
            Math.pow(endPos.y - startPos.y, 2) +
            Math.pow(endPos.z - startPos.z, 2)
          )
          return {
            direction,
            duration,
            startPos,
            endPos,
            distance: distance.toFixed(2),
            moved: distance > 0.01,
            animationMode: player.mode,
          }
        }
        requestAnimationFrame(handleTick)
      }
      handleTick()
    },
    playerPerformance: () => {
      const player = window.__DEBUG__.player()
      if (!player) return { error: 'No player found' }
      return {
        hasUpdateMatrix: typeof player.avatar?.raw?.scene?.updateMatrix === 'function',
        hasUpdateMatrixWorld: typeof player.avatar?.raw?.scene?.updateMatrixWorld === 'function',
        avatarVisible: player.avatar?.raw?.scene?.visible || false,
        physicsActive: !!player.physics,
        physicsUpdateRate: player.physics ? 'active' : 'inactive',
        inputProcessorActive: !!player.inputProcessor,
        animationControllerActive: !!player.animationController,
        networkSynchronizerActive: !!player.networkSynchronizer,
        cameraManagerActive: !!player.cam,
      }
    },

    getScriptErrors: () => window.__DEBUG__.logs.errors.filter(e => String(e.args[0]).includes('Script')),
    getScriptWarnings: () => window.__DEBUG__.logs.warnings.filter(w => String(w.args[0]).includes('Script')),

    findNodesByName: (name) => {
      const results = []
      const apps = Array.from(world.entities.items.values()).filter(e => e.isApp)
      apps.forEach(app => {
        if (app.root?.children) {
          const found = app.root.children.filter(c => c.name === name)
          results.push({ appId: app.data.id, nodes: found })
        }
      })
      return results
    },

    getNetworkStats: () => ({
      id: world.network.id,
      isServer: world.network.isServer,
      isClient: world.network.isClient,
      connected: world.network.ws ? true : false,
    }),

    getBlueprintStats: () => {
      const bps = Array.from(world.blueprints.items.values())
      return {
        total: bps.length,
        byType: {
          apps: bps.filter(b => !b.model && b.script).length,
          models: bps.filter(b => b.model && !b.script).length,
          scenes: bps.filter(b => b.scene).length,
        },
        list: bps.map(b => ({ id: b.id, name: b.name, version: b.version }))
      }
    },

    getPerformanceMetrics: () => ({
      entitiesCount: world.entities.items.size,
      blueprintsCount: world.blueprints.items.size,
      appsCount: Array.from(world.entities.items.values()).filter(e => e.isApp).length,
      playersCount: Array.from(world.entities.items.values()).filter(e => e.isPlayer).length,
    }),

    getFeatures: () => world.features || {},
    getCapabilities: () => world.capabilities || {},
    getDegradationStatus: () => ({
      audio: world.audio?.degraded || false,
      livekit: world.livekit?.degraded || false,
      network: world.network?.offlineMode || false,
      features: world.features || {},
      capabilities: world.capabilities || {},
    }),
    getFallbackLog: () => world.loader?.getFallbackLog?.() || [],

    checkSceneApp: () => {
      const apps = Array.from(world.entities.items.values()).filter(e => e.isApp)
      const sceneApp = apps.find(app => app.data.id.includes('scene'))
      if (!sceneApp) return { error: 'Scene app not found' }
      const blueprint = world.blueprints.get(sceneApp.data.blueprint)
      return {
        appId: sceneApp.data.id,
        mode: sceneApp.mode,
        blueprintName: blueprint?.name,
        childCount: sceneApp.root?.children?.length || 0,
        hasErrors: window.__DEBUG__.logs.errors.length > 0,
        lastError: window.__DEBUG__.logs.errors[window.__DEBUG__.logs.errors.length - 1]?.args[0],
      }
    },

    placementState: () => {
      const builder = world.builder
      const composer = builder?.composer
      const selectionMgr = composer?.selectionManager
      const stateTransition = composer?.stateTransitionHandler
      const apps = Array.from(world.entities.items.values()).filter(e => e.isApp).filter(e => !e.data.id.includes('scene'))

      return {
        builderEnabled: builder?.enabled || false,
        builderSelectedId: builder?.selected?.data?.id || null,
        selectionMgrSelectedId: selectionMgr?.selected?.data?.id || null,
        selectedApp: builder?.selected ? {
          id: builder.selected.data.id,
          mode: builder.selected.mode,
          mover: builder.selected.data.mover,
          position: builder.selected.root.position.toArray(),
          isMover: builder.selected.data.mover === world.network.id,
        } : null,
        modelApps: apps.map(app => ({
          id: app.data.id,
          mode: app.mode,
          mover: app.data.mover,
          isMover: app.data.mover === world.network.id,
          position: app.root.position.toArray(),
        })),
        stateMismatch: builder?.selected?.data?.id !== selectionMgr?.selected?.data?.id ? 'MISMATCH!' : 'OK',
      }
    },

    testPlacementFinalization: (appId) => {
      const app = world.entities.get(appId)
      if (!app?.isApp) return { error: `App ${appId} not found` }
      if (app.data.mover !== world.network.id) return { error: 'App not being moved by this client' }

      const beforeMover = app.data.mover
      const beforeMode = app.mode

      world.builder.composer.stateTransitionHandler.select(null)

      const afterMover = app.data.mover
      const afterMode = app.mode

      return {
        success: afterMover === null && beforeMover === world.network.id,
        beforeMover,
        afterMover,
        beforeMode,
        afterMode,
        moverCleared: afterMover === null,
      }
    },

    assertPlacementReady: () => {
      const assertions = []
      const builder = world.builder
      const apps = Array.from(world.entities.items.values()).filter(e => e.isApp).filter(e => !e.data.id.includes('scene'))

      if (!builder) assertions.push('❌ Builder system missing')
      else assertions.push('✅ Builder system available')

      if (!builder?.composer?.selectionManager) assertions.push('❌ SelectionManager missing')
      else assertions.push('✅ SelectionManager available')

      if (!builder?.composer?.stateTransitionHandler) assertions.push('❌ StateTransitionHandler missing')
      else assertions.push('✅ StateTransitionHandler available')

      const modelApps = apps.filter(a => a.data.blueprint !== '$scene')
      if (modelApps.length === 0) assertions.push('⚠️  No model apps created yet')
      else assertions.push(`✅ ${modelApps.length} model app(s) exist`)

      const movingApps = modelApps.filter(a => a.data.mover === world.network.id)
      if (movingApps.length > 0) assertions.push(`✅ ${movingApps.length} app(s) in MOVING mode`)
      else assertions.push('⚠️  No apps in MOVING mode')

      return {
        assertions,
        all_pass: assertions.every(a => a.startsWith('✅')),
      }
    },

    resources: {
      snapshot: () => ResourceTracker.snapshot(),
      getReport: (threshold = 10) => ResourceTracker.getReport(threshold),
      getStats: () => ResourceTracker.getStats(),
      clear: () => ResourceTracker.clear(),
      trackNode: (node, metadata) => ResourceTracker.trackNode(node, metadata),
      trackEntity: (entity, metadata) => ResourceTracker.trackEntity(entity, metadata),
      trackApp: (app, metadata) => ResourceTracker.trackApp(app, metadata),
    },

    dependencies: {
      validateGraph: () => dependencyValidator.validateGraph(),
      getReport: () => dependencyValidator.getReport(),
      getExecutionOrder: () => dependencyValidator.getExecutionOrder(),
      getDependencyGraph: () => dependencyValidator.getDependencyGraph(),
      registerSystem: (name, deps, metadata) => dependencyValidator.registerSystem(name, deps, metadata),
    },

    cleanup: {
      getStats: () => cleanupTracker.getStats(),
      getReport: () => cleanupTracker.getDetailedReport(),
      register: (name, fn, priority) => cleanupTracker.registerCleanup(name, fn, priority),
      execute: (filter) => cleanupTracker.executeCleanups(filter),
      printGuide: (category) => printCleanupGuide(category),
      reset: () => cleanupTracker.reset(),
    },

    plugins: {
      getAll: () => world.pluginRegistry?.getAllPlugins() || [],
      get: (name) => world.pluginRegistry?.getPlugin(name) || null,
      getAssetHandlers: (type) => world.pluginRegistry?.getAssetHandlers(type) || [],
      getNetworkHandler: (messageType) => world.pluginRegistry?.getNetworkHandler(messageType) || null,
      getScriptGlobals: () => world.pluginRegistry?.getScriptGlobals() || {},
      getServerRoutes: () => world.pluginRegistry?.getServerRoutes() || [],
      getHooks: () => world.pluginHooks?.getHooks() || [],
      getHookDetails: (hookName) => world.pluginHooks?.getHookDetails(hookName) || null,
      listAllHooks: () => {
        const hooks = world.pluginHooks?.getHooks() || []
        return hooks.map(name => ({
          name,
          details: world.pluginHooks.getHookDetails(name),
        }))
      },
    },

    performance: {
      getStats: (label) => world.performanceMonitor?.getStats(label) || null,
      getAllStats: () => world.performanceMonitor?.getAllStats() || {},
      getViolations: (limit) => world.performanceMonitor?.getViolations(limit) || [],
      getViolationSummary: () => world.performanceMonitor?.getViolationSummary() || [],
      getBudget: (category, path) => world.performanceBudget?.getBudget(category, path) || null,
      getBudgets: () => world.performanceBudget?.BUDGETS || {},
      isEnabled: () => world.performanceMonitor?.enabled || false,
      enable: () => world.performanceMonitor?.enable(),
      disable: () => world.performanceMonitor?.disable(),
      setSampleRate: (rate) => world.performanceMonitor?.setSampleRate(rate),
      clear: () => world.performanceMonitor?.clear(),
      getSampleData: () => ({
        framePhases: world.performanceMonitor?.samples.framePhases.getAll() || [],
        systemPhases: world.performanceMonitor?.samples.systemPhases.getAll() || [],
        entityOperations: world.performanceMonitor?.samples.entityOperations.getAll() || [],
      }),
    },

    memory: {
      takeSnapshot: (label) => world.memoryAnalyzer?.takeSnapshot(label)?.export(),
      getSnapshot: (index) => world.memoryAnalyzer?.getSnapshot(index)?.export() || null,
      getAllSnapshots: () => world.memoryAnalyzer?.getAllSnapshots().map(s => s.export()) || [],
      compareSnapshots: (index1, index2) => world.memoryAnalyzer?.compareSnapshots(index1, index2) || null,
      getLeaks: () => world.memoryAnalyzer?.detectLeaks() || [],
      getReport: () => world.memoryAnalyzer?.getReport() || null,
      getGrowthRate: (startIndex, endIndex) => world.memoryAnalyzer?.getGrowthRate(startIndex, endIndex) || null,
      getHeapTrend: () => world.memoryAnalyzer?.getHeapTrend() || [],
      getObjectTypeTrend: (type) => world.memoryAnalyzer?.getObjectTypeGrowthTrend(type) || [],
      clear: () => world.memoryAnalyzer?.clear(),
      getMetadata: () => {
        const snapshots = world.memoryAnalyzer?.getAllSnapshots() || []
        return {
          snapshotCount: snapshots.length,
          totalCapacity: world.memoryAnalyzer?.maxSnapshots || 0,
          timespan: snapshots.length > 1 ? {
            start: snapshots[0].timestamp,
            end: snapshots[snapshots.length - 1].timestamp,
            duration: snapshots[snapshots.length - 1].timestamp - snapshots[0].timestamp,
          } : null,
        }
      },
    },

    degradation: {
      registerFeature: (name, options) => world.degradation?.registerFeature(name, options),
      enableFeature: (name, testFn) => world.degradation?.enableFeature(name, testFn),
      getFeatureStatus: (name) => world.degradation?.getFeatureStatus(name),
      getAllStatus: () => world.degradation?.getAllStatus(),
      getDegradationStatus: () => world.degradation?.getDegradationStatus(),
      isFeatureAvailable: (name) => world.degradation?.isFeatureAvailable(name),
      isFeatureDegraded: (name) => world.degradation?.isFeatureDegraded(name),
      canContinue: (name) => world.degradation?.canContinue(name),
      getReport: () => world.degradation?.getReport(),
      activateFallback: (name) => world.degradation?.activateFallback(name),
    },

    dashboard: {
      getDashboard: () => world.dashboard?.getDashboard(),
      getMetric: (name) => world.dashboard?.getMetric(name),
      getAllMetrics: () => world.dashboard?.getAllMetrics(),
      getMetricHistory: (name, limit) => world.dashboard?.getMetricHistory(name, limit),
      getMetricStats: (name) => world.dashboard?.getMetricStats(name),
      getActiveAlerts: () => world.dashboard?.getActiveAlerts(),
      acknowledgeAlert: (alertId) => world.dashboard?.acknowledgeAlert(alertId),
      clearAlerts: () => world.dashboard?.clearAlerts(),
      getSummary: () => world.dashboard?.getSummary(),
      getTrends: () => world.dashboard?.getTrends(),
      getTopMetrics: (limit) => world.dashboard?.getTopMetrics(limit),
      startCollection: () => world.metricsCollector?.setupDefaultCollectors().setupThresholds().start(),
      stopCollection: () => world.metricsCollector?.stop(),
      getHealthReport: () => world.metricsCollector?.getHealthReport(),
      getMetricsByCategory: () => world.metricsCollector?.getMetricsByCategory(),
      setThreshold: (metric, value, severity) => world.dashboard?.setThreshold(metric, value, severity),
    },

    events: {
      getEmitterStats: (name) => world.eventAudit?.getEmitterStats(name),
      getAllStats: () => world.eventAudit?.getAllStats(),
      getEventHistory: (emitter, event, limit) => world.eventAudit?.getEventHistory(emitter, event, limit),
      getTopEvents: (limit) => world.eventAudit?.getTopEvents(limit),
      getAnomalies: (threshold) => world.eventAudit?.getAnomalies(threshold),
      getAuditReport: () => world.eventAudit?.getReport(),
      enableAudit: () => world.eventAudit?.enable(),
      disableAudit: () => world.eventAudit?.disable(),
      clearAudit: () => world.eventAudit?.clear(),
      registerEvent: (name, options) => world.eventRegistry?.registerEvent(name, options),
      getEvent: (name) => world.eventRegistry?.getEvent(name),
      getEventsByCategory: (category) => world.eventRegistry?.getEventsByCategory(category),
      getAllEvents: () => world.eventRegistry?.getAllEvents(),
      getDocumentation: (name) => world.eventRegistry?.getEventDocumentation(name),
      getAllDocumentation: () => world.eventRegistry?.getAllDocumentation(),
      validateEventData: (name, data) => world.eventRegistry?.validateEventData(name, data),
      exportRegistry: () => world.eventRegistry?.exportRegistry(),
    },

    loadShedding: {
      registerBoundary: (name, options) => world.loadShedder?.registerBoundary(name, options),
      updateQueueDepth: (boundary, depth, latency) => world.loadShedder?.updateQueueDepth(boundary, depth, latency),
      shouldDropRequest: (boundary, isPriority) => world.loadShedder?.shouldDropRequest(boundary, isPriority),
      tripCircuitBreaker: (boundary) => world.loadShedder?.tripCircuitBreaker(boundary),
      recordDropped: (boundary, count) => world.loadShedder?.recordDropped(boundary, count),
      recordProcessed: (boundary, count) => world.loadShedder?.recordProcessed(boundary, count),
      getShedStatus: () => world.loadShedder?.getShedStatus(),
      getMetrics: (boundary) => world.loadShedder?.getMetrics(boundary),
      reset: (boundary) => world.loadShedder?.reset(boundary),
      resetAll: () => world.loadShedder?.resetAll(),
    },

    rateLimiting: {
      createLimiter: (name, options) => world.rateLimiter?.createLimiter(name, options),
      canProcess: (limiter) => world.rateLimiter?.canProcess(limiter),
      adaptThresholds: () => world.rateLimiter?.adaptThresholds(),
      getLimiterStatus: (name) => world.rateLimiter?.getLimiterStatus(name),
      getAllStatus: () => world.rateLimiter?.getAllStatus(),
      reset: (name) => world.rateLimiter?.reset(name),
      resetAll: () => world.rateLimiter?.resetAll(),
      setAdaptive: (enabled) => world.rateLimiter?.setAdaptive(enabled),
    },

    queuing: {
      createQueue: (name, options) => world.queueManager?.createQueue(name, options),
      enqueue: (queue, item, priority) => world.queueManager?.enqueue(queue, item, priority),
      dequeue: (queue, count) => world.queueManager?.dequeue(queue, count),
      drain: (queue) => world.queueManager?.drain(queue),
      drainAll: () => world.queueManager?.drainAll(),
      peek: (queue, count) => world.queueManager?.peek(queue, count),
      getQueueStats: (queue) => world.queueManager?.getQueueStats(queue),
      getAllQueueStats: () => world.queueManager?.getAllQueueStats(),
      isEmpty: (queue) => world.queueManager?.isEmpty(queue),
      clear: (queue) => world.queueManager?.clear(queue),
      clearAll: () => world.queueManager?.clearAll(),
    },
  }

  logger.info('Global debug utilities available at window.__DEBUG__')
  logger.info('Player: window.__DEBUG__.player() | playerState() | avatarHierarchy() | playerPerformance()')
  logger.info('Quick check: window.__DEBUG__.checkSceneApp() | getPerformanceMetrics()')
  logger.info('Apps: window.__DEBUG__.apps() | getAppState("app-id") | findNodesByName("sky")')
}
