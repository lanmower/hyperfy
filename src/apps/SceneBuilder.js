export class SceneBuilder {
  constructor(appRuntime) {
    this.runtime = appRuntime
    this.scenes = new Map()
    this.sceneEntities = new Map()
  }

  createScene(name, def) {
    const entities = new Map()
    const apps = new Map()
    if (def.gravity) this.runtime.gravity = [...def.gravity]
    if (def.spawnPoint) this.runtime.worldSpawnPoint = [...def.spawnPoint]
    for (const ed of def.entities || []) {
      const cfg = {
        model: ed.model,
        position: ed.position || [0, 0, 0],
        rotation: ed.rotation,
        scale: ed.scale,
        app: ed.app,
        config: ed.config || null
      }
      if (ed.model && !ed.app) cfg.autoTrimesh = true
      const entity = this.runtime.spawnEntity(ed.id || null, cfg)
      entities.set(entity.id, entity)
      if (ed.app) apps.set(entity.id, ed.app)
    }
    this.scenes.set(name, def)
    this.sceneEntities.set(name, Array.from(entities.keys()))
    return { entities, apps, count: entities.size }
  }

  addEntityToScene(scene, id, cfg, app) {
    if (!this.sceneEntities.has(scene)) this.sceneEntities.set(scene, [])
    const entity = this.runtime.spawnWithApp(id, cfg, app)
    this.sceneEntities.get(scene).push(entity.id)
    return entity
  }

  removeEntityFromScene(scene, eid) {
    const ids = this.sceneEntities.get(scene)
    if (!ids) return false
    const idx = ids.indexOf(eid)
    if (idx < 0) return false
    ids.splice(idx, 1)
    this.runtime.destroyEntity(eid)
    return true
  }

  swapScenes(old, new_) {
    const oldIds = this.sceneEntities.get(old) || []
    for (const eid of oldIds) {
      const e = this.runtime.getEntity(eid)
      if (e) this.runtime.destroyEntity(eid)
    }
    this.sceneEntities.set(old, [])
    const newDef = this.scenes.get(new_)
    if (newDef) {
      const result = this.createScene(new_, newDef)
      return result
    }
    return null
  }

  getSceneEntities(name) {
    const ids = this.sceneEntities.get(name) || []
    return ids.map(id => this.runtime.getEntity(id)).filter(e => e)
  }

  removeScene(name) {
    const ids = this.sceneEntities.get(name) || []
    for (const eid of ids) this.runtime.destroyEntity(eid)
    this.sceneEntities.delete(name)
    this.scenes.delete(name)
  }
}
