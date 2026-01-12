export const ServerDebugInspection = {
  getLoadingStats(world) {
    return {
      totalLoaded: world.loader?.stats?.loaded || 0,
      totalFailed: world.loader?.stats?.failed || 0,
      currentlyLoading: world.loader?.loading?.size || 0,
      cacheSize: world.loader?.cache?.size || 0,
    }
  },

  getPhysicsStats(world) {
    return {
      sceneActive: !!world.physics?.scene,
      activeActors: world.physics?.active?.size || 0,
      totalActors: world.physics?.handles?.size || 0,
      hasContactCallbacks: world.physics?.contactCallbacks?.size > 0,
      hasTriggerCallbacks: world.physics?.triggerCallbacks?.size > 0,
    }
  },

  getMetrics(world) {
    const metrics = world.metrics
    if (!metrics) return { error: 'Metrics not enabled' }
    return metrics.snapshot()
  },

  getTraces(world) {
    const tracer = world.tracer
    if (!tracer) return { error: 'Tracing not enabled' }
    return {
      activeContexts: tracer.getActiveContexts(),
      recordedTraces: tracer.getRecordedTraces().slice(-10),
      stats: tracer.getStats(),
    }
  },

  getErrors(world) {
    const errors = world.errors
    if (!errors) return { error: 'Error monitoring not available' }
    return {
      totalErrors: errors.errors?.length || 0,
      recentErrors: errors.getErrors?.() || [],
      stats: errors.getStats?.() || {},
    }
  },

  getHealthStatus(world) {
    return {
      systems: {
        physics: !!world.physics?.scene,
        network: world.network?.connected,
        loader: !!world.loader,
        entities: world.entities?.items?.size > 0,
      },
      entities: {
        total: world.entities?.items?.size || 0,
        apps: world.entities?.apps?.length || 0,
        players: world.entities?.playerEntities?.length || 0,
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
    }
  },

  checkSceneIntegrity(world) {
    const apps = world.entities?.apps || []
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

  testWorldIntegrity(world) {
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
