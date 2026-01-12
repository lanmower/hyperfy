import { cleanupTracker, printCleanupGuide } from '../../core/lifecycle/index.js'
import { ResourceTracker } from '../../core/debug/ResourceTracker.js'

export function setupDebugSystems(world, consoleLogs) {
  return {
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
    getScriptErrors: () => consoleLogs.errors.filter(e => String(e.args[0]).includes('Script')),
    getScriptWarnings: () => consoleLogs.warnings.filter(w => String(w.args[0]).includes('Script')),
    getPerformanceMetrics: () => ({
      entitiesCount: world.entities.items.size,
      blueprintsCount: world.blueprints.items.size,
      appsCount: world.entities.apps.length,
      playersCount: world.entities.playerEntities.length,
    }),
    checkSceneApp: () => {
      const apps = world.entities.apps
      const sceneApp = apps.find(app => app.data.id.includes('scene'))
      if (!sceneApp) return { error: 'Scene app not found' }
      const blueprint = world.blueprints.get(sceneApp.data.blueprint)
      return {
        appId: sceneApp.data.id,
        mode: sceneApp.mode,
        blueprintName: blueprint?.name,
        childCount: sceneApp.root?.children?.length || 0,
        hasErrors: consoleLogs.errors.length > 0,
        lastError: consoleLogs.errors[consoleLogs.errors.length - 1]?.args[0],
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

    cleanup: {
      getStats: () => cleanupTracker.getStats(),
      getReport: () => cleanupTracker.getDetailedReport(),
      register: (name, fn, priority) => cleanupTracker.registerCleanup(name, fn, priority),
      execute: (filter) => cleanupTracker.executeCleanups(filter),
      printGuide: (category) => printCleanupGuide(category),
      reset: () => cleanupTracker.reset(),
    },
  }
}
