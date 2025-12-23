export function setupDebugGlobals(world) {
  if (typeof window === 'undefined') return

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
    logs: {
      errors: [],
      warnings: [],
      info: [],
    },

    // APP DEBUGGING
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

    // PLAYER DEBUGGING
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

    // SCRIPT DEBUGGING
    getScriptErrors: () => window.__DEBUG__.logs.errors.filter(e => String(e.args[0]).includes('Script')),
    getScriptWarnings: () => window.__DEBUG__.logs.warnings.filter(w => String(w.args[0]).includes('Script')),

    // NODE DEBUGGING
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

    // NETWORK DEBUGGING
    getNetworkStats: () => ({
      id: world.network.id,
      isServer: world.network.isServer,
      isClient: world.network.isClient,
      connected: world.network.ws ? true : false,
    }),

    // BLUEPRINT DEBUGGING
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

    // PERFORMANCE DEBUGGING
    getPerformanceMetrics: () => ({
      entitiesCount: world.entities.items.size,
      blueprintsCount: world.blueprints.items.size,
      appsCount: Array.from(world.entities.items.values()).filter(e => e.isApp).length,
      playersCount: Array.from(world.entities.items.values()).filter(e => e.isPlayer).length,
    }),

    // QUICK CHECKS
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
  }

  // Hook console to capture logs with limit
  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error
  const MAX_LOGS = 500

  const pushLog = (arr, item) => {
    arr.push(item)
    if (arr.length > MAX_LOGS) arr.shift()
  }

  console.log = function(...args) {
    pushLog(window.__DEBUG__.logs.info, { time: new Date(), args })
    return originalLog.apply(console, args)
  }

  console.warn = function(...args) {
    pushLog(window.__DEBUG__.logs.warnings, { time: new Date(), args })
    return originalWarn.apply(console, args)
  }

  console.error = function(...args) {
    pushLog(window.__DEBUG__.logs.errors, { time: new Date(), args })
    return originalError.apply(console, args)
  }

  console.log('[DEBUG] Global debug utilities available at window.__DEBUG__')
  console.log('[DEBUG] Quick check: await page.evaluate(() => window.__DEBUG__.checkSceneApp())')
  console.log('[DEBUG] Get app state: await page.evaluate(() => window.__DEBUG__.getAppState("app-id"))')
  console.log('[DEBUG] Find nodes: await page.evaluate(() => window.__DEBUG__.findNodesByName("sky"))')
}
