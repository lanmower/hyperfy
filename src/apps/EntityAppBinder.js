export class EntityAppBinder {
  constructor(runtime, loader) {
    this._runtime = runtime
    this._loader = loader
    this._bindings = new Map()
  }

  spawn(id, config = {}) {
    const entity = this._runtime.spawnEntity(id, config)
    if (config.app) {
      this._bindings.set(entity.id, config.app)
    }
    return entity
  }

  attach(entityId, appName) {
    const entity = this._runtime.getEntity(entityId)
    if (!entity) {
      console.error(`[EntityAppBinder] entity ${entityId} not found`)
      return false
    }
    entity._appName = appName
    this._runtime.attachApp(entityId, appName)
    this._bindings.set(entityId, appName)
    return true
  }

  detach(entityId) {
    this._runtime.detachApp(entityId)
    this._bindings.delete(entityId)
  }

  destroy(entityId) {
    this._runtime.destroyEntity(entityId)
    this._bindings.delete(entityId)
  }

  getBinding(entityId) {
    return this._bindings.get(entityId) || null
  }

  getAllBindings() {
    return new Map(this._bindings)
  }

  async loadWorld(worldDef) {
    const results = []
    if (worldDef.gravity) {
      this._runtime.gravity = [...worldDef.gravity]
    }
    for (const entDef of worldDef.entities || []) {
      const spawnConfig = {
        model: entDef.model,
        position: entDef.position,
        rotation: entDef.rotation,
        scale: entDef.scale,
        app: entDef.app,
        config: entDef.config || null
      }
      if (entDef.model && !entDef.app) {
        spawnConfig.autoTrimesh = true
      }
      const entity = this.spawn(entDef.id || null, spawnConfig)
      results.push(entity)
    }
    return results
  }

  getEntityCount() {
    return this._runtime.entities.size
  }

  getAppCount() {
    return this._bindings.size
  }
}
