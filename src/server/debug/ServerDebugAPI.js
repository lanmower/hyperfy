import { ComponentLogger } from '../../core/utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('ServerDebugAPI')

export function setupServerDebugGlobals(world) {
  const debugGlobals = {
    world,

    getWorld: () => ({
      systemCount: world.systems.size,
      systemNames: Array.from(world.systems.keys()),
      blueprintsCount: world.blueprints?.items?.size || 0,
      entitiesCount: world.entities?.items?.size || 0,
    }),

    getSystems: () => Array.from(world.systems.entries()).map(([name, system]) => ({
      name,
      type: system.constructor.name,
    })),

    getSystem: (name) => {
      const system = world.systems.get(name)
      return system ? {
        name,
        type: system.constructor.name,
        methods: Object.getOwnPropertyNames(Object.getPrototypeOf(system)).filter(m => m !== 'constructor'),
      } : null
    },

    getBlueprints: () => {
      const blueprints = []
      world.blueprints?.items?.forEach((bp, id) => {
        blueprints.push({
          id,
          name: bp.name,
          version: bp.version,
          hasModel: !!bp.model,
          hasScript: !!bp.script,
        })
      })
      return blueprints
    },

    getBlueprint: (id) => {
      const bp = world.blueprints?.get(id)
      return bp ? {
        id,
        name: bp.name,
        version: bp.version,
        model: bp.model || null,
        script: bp.script ? '(code)' : null,
        props: bp.props || {},
      } : null
    },

    getEntities: () => {
      const entities = []
      world.entities?.items?.forEach((entity, id) => {
        entities.push({
          id,
          type: entity.constructor.name,
          data: {
            id: entity.data?.id,
            type: entity.data?.type,
            blueprint: entity.data?.blueprint,
          },
        })
      })
      return entities
    },

    getEntity: (id) => {
      const entity = world.entities?.get(id)
      return entity ? {
        id: entity.data?.id,
        type: entity.constructor.name,
        dataType: entity.data?.type,
        blueprint: entity.data?.blueprint,
        hasChildren: entity.children?.size > 0,
        childCount: entity.children?.size || 0,
      } : null
    },

    getApps: () => {
      const apps = []
      world.entities?.items?.forEach((entity) => {
        if (entity.isApp) {
          apps.push({
            id: entity.data?.id,
            blueprint: entity.data?.blueprint,
            mode: entity.mode,
            childCount: entity.root?.children?.length || 0,
          })
        }
      })
      return apps
    },

    getPlayers: () => {
      const players = []
      world.entities?.items?.forEach((entity) => {
        if (entity.isPlayer) {
          players.push({
            id: entity.data?.id,
            userId: entity.data?.userId,
            isLocal: entity.isLocal,
            position: entity.data?.position,
            hasAvatar: !!entity.avatar,
          })
        }
      })
      return players
    },

    getNetworkStats: () => ({
      id: world.network?.id || null,
      isServer: world.network?.isServer || false,
      isClient: world.network?.isClient || false,
      connected: world.network?.connected || false,
      clientCount: world.network?.clients?.size || 0,
    }),

    getConnectedClients: () => {
      const clients = []
      world.network?.clients?.forEach((client, id) => {
        clients.push({
          id,
          userId: client.userId,
          authenticated: client.authenticated,
          connected: client.connected,
        })
      })
      return clients
    },

    getLoadingStats: () => ({
      totalLoaded: world.loader?.stats?.loaded || 0,
      totalFailed: world.loader?.stats?.failed || 0,
      currentlyLoading: world.loader?.loading?.size || 0,
      cacheSize: world.loader?.cache?.size || 0,
    }),

    getPhysicsStats: () => ({
      sceneActive: !!world.physics?.scene,
      activeActors: world.physics?.active?.size || 0,
      totalActors: world.physics?.handles?.size || 0,
      hasContactCallbacks: world.physics?.contactCallbacks?.size > 0,
      hasTriggerCallbacks: world.physics?.triggerCallbacks?.size > 0,
    }),

    getMetrics: () => {
      const metrics = world.metrics
      if (!metrics) return { error: 'Metrics not enabled' }
      return metrics.snapshot()
    },

    getTraces: () => {
      const tracer = world.tracer
      if (!tracer) return { error: 'Tracing not enabled' }
      return {
        activeContexts: tracer.getActiveContexts(),
        recordedTraces: tracer.getRecordedTraces().slice(-10),
        stats: tracer.getStats(),
      }
    },

    getErrors: () => {
      const errorMonitor = world.errorMonitor
      if (!errorMonitor) return { error: 'Error monitoring not available' }
      return {
        totalErrors: errorMonitor.errorCount || 0,
        recentErrors: errorMonitor.getRecentErrors?.() || [],
        errorsBySystem: errorMonitor.getErrorsBySystem?.() || {},
      }
    },

    getHealthStatus: () => ({
      systems: {
        physics: !!world.physics?.scene,
        network: world.network?.connected,
        loader: !!world.loader,
        entities: world.entities?.items?.size > 0,
      },
      entities: {
        total: world.entities?.items?.size || 0,
        apps: Array.from(world.entities?.items?.values() || []).filter(e => e.isApp).length,
        players: Array.from(world.entities?.items?.values() || []).filter(e => e.isPlayer).length,
      },
      network: {
        clientsConnected: world.network?.clients?.size || 0,
        serverRunning: world.network?.isServer || false,
      },
      resources: {
        loaded: world.loader?.stats?.loaded || 0,
        failed: world.loader?.stats?.failed || 0,
        loading: world.loader?.loading?.size || 0,
      },
    }),

    checkSceneIntegrity: () => {
      const apps = Array.from(world.entities?.items?.values() || []).filter(e => e.isApp)
      const sceneApp = apps.find(a => a.data?.id?.includes('scene'))
      return {
        sceneAppFound: !!sceneApp,
        sceneAppId: sceneApp?.data?.id || null,
        sceneAppMode: sceneApp?.mode || null,
        blueprintLoaded: !!sceneApp?.blueprint,
        scriptReady: !!sceneApp?.scriptExecutor?.context,
        childCount: sceneApp?.root?.children?.length || 0,
      }
    },

    testWorldIntegrity: () => {
      const issues = []
      const checks = []

      if (!world.network) issues.push('Network system missing')
      else checks.push('✓ Network system available')

      if (!world.entities) issues.push('Entities system missing')
      else checks.push('✓ Entities system available')

      if (!world.blueprints) issues.push('Blueprints system missing')
      else checks.push('✓ Blueprints system available')

      if (!world.physics) issues.push('Physics system missing')
      else checks.push('✓ Physics system available')

      if (!world.loader) issues.push('Loader system missing')
      else checks.push('✓ Loader system available')

      const clientCount = world.network?.clients?.size || 0
      if (clientCount === 0) checks.push('⚠ No clients connected')
      else checks.push(`✓ ${clientCount} client(s) connected`)

      const entityCount = world.entities?.items?.size || 0
      if (entityCount === 0) issues.push('⚠ No entities in world')
      else checks.push(`✓ ${entityCount} entity/entities in world`)

      return {
        passed: issues.length === 0,
        checks,
        issues,
      }
    },
  }

  if (typeof global !== 'undefined') {
    global.__DEBUG__ = debugGlobals
  }

  logger.info('Server debug globals available at global.__DEBUG__')

  return debugGlobals
}
