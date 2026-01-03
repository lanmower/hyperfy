export const ServerDebugCommands = {
  getWorldInfo(world) {
    return {
      systemCount: world.systems.size,
      systemNames: Array.from(world.systems.keys()),
      blueprintsCount: world.blueprints?.items?.size || 0,
      entitiesCount: world.entities?.items?.size || 0,
    }
  },

  getSystems(world) {
    return Array.from(world.systems.entries()).map(([name, system]) => ({
      name,
      type: system.constructor.name,
    }))
  },

  getSystem(world, name) {
    const system = world.systems.get(name)
    return system ? {
      name,
      type: system.constructor.name,
      methods: Object.getOwnPropertyNames(Object.getPrototypeOf(system)).filter(m => m !== 'constructor'),
    } : null
  },

  getBlueprints(world) {
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

  getBlueprint(world, id) {
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

  getEntities(world) {
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

  getEntity(world, id) {
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

  getApps(world) {
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

  getPlayers(world) {
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

  getNetworkStats(world) {
    return {
      id: world.network?.id || null,
      isServer: world.network?.isServer || false,
      isClient: world.network?.isClient || false,
      connected: world.network?.connected || false,
      clientCount: world.network?.clients?.size || 0,
    }
  },

  getConnectedClients(world) {
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
}
