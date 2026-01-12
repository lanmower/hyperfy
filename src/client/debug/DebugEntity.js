export function setupDebugEntity(world) {
  return {
    getEntity: (id) => world.entities.get(id),
    getBlueprint: (id) => world.blueprints.get(id),
    entities: () => Array.from(world.entities.items.values()),
    blueprints: () => Array.from(world.blueprints.items.entries()),
    apps: () => world.entities.apps,
    players: () => world.entities.playerEntities,

    getAppByBlueprint: (blueprintName) => {
      const apps = world.entities.apps
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

    findNodesByName: (name) => {
      const results = []
      const apps = world.entities.apps
      apps.forEach(app => {
        if (app.root?.children) {
          const found = app.root.children.filter(c => c.name === name)
          results.push({ appId: app.data.id, nodes: found })
        }
      })
      return results
    },

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
  }
}
