import { AppContext } from './AppContext.js'

export class AppRuntime {
  constructor(config = {}) {
    this.entities = new Map()
    this.apps = new Map()
    this.contexts = new Map()
    this.gravity = config.gravity || [0, -9.81, 0]
    this.currentTick = 0
    this.deltaTime = 0
    this.elapsed = 0
    this._players = new Map()
    this._playerManager = config.playerManager || null
    this._physics = config.physics || null
    this._nextEntityId = 1
    this._appDefs = new Map()
  }

  registerApp(name, appDef) { this._appDefs.set(name, appDef) }

  spawnEntity(id, config = {}) {
    const entityId = id || `entity_${this._nextEntityId++}`
    const entity = {
      id: entityId,
      model: config.model || null,
      position: config.position ? [...config.position] : [0, 0, 0],
      rotation: config.rotation || [0, 0, 0, 1],
      scale: config.scale ? [...config.scale] : [1, 1, 1],
      velocity: [0, 0, 0],
      mass: 1,
      bodyType: 'static',
      collider: null,
      _appState: null,
      _appName: config.app || null,
      custom: null
    }
    this.entities.set(entityId, entity)
    if (config.app) this._attachApp(entityId, config.app)
    return entity
  }

  _attachApp(entityId, appName) {
    const entity = this.entities.get(entityId)
    const appDef = this._appDefs.get(appName)
    if (!entity || !appDef) return
    const serverDef = appDef.server || appDef
    const ctx = new AppContext(entity, this)
    this.contexts.set(entityId, ctx)
    this.apps.set(entityId, appDef)
    this._safeCall(serverDef, 'setup', null, [ctx], `setup(${appName})`)
  }

  attachApp(entityId, appName) { this._attachApp(entityId, appName) }

  detachApp(entityId) {
    const appDef = this.apps.get(entityId)
    const ctx = this.contexts.get(entityId)
    if (appDef && ctx) {
      const serverDef = appDef.server || appDef
      this._safeCall(serverDef, 'teardown', null, [ctx], 'teardown')
    }
    this.apps.delete(entityId)
    this.contexts.delete(entityId)
  }

  destroyEntity(entityId) {
    this.detachApp(entityId)
    this.entities.delete(entityId)
  }

  tick(tickNum, dt) {
    this.currentTick = tickNum
    this.deltaTime = dt
    this.elapsed += dt
    for (const [entityId, appDef] of this.apps) {
      const ctx = this.contexts.get(entityId)
      if (!ctx) continue
      const serverDef = appDef.server || appDef
      this._safeCall(serverDef, 'update', null, [ctx, dt], `update(${entityId})`)
    }
  }

  getSnapshot() {
    const entities = []
    for (const [id, entity] of this.entities) {
      entities.push({
        id,
        model: entity.model,
        position: [...entity.position],
        rotation: Array.isArray(entity.rotation) ? [...entity.rotation] : [entity.rotation.x || 0, entity.rotation.y || 0, entity.rotation.z || 0, entity.rotation.w || 1],
        scale: [...entity.scale],
        bodyType: entity.bodyType,
        custom: entity.custom || null
      })
    }
    return { tick: this.currentTick, timestamp: Date.now(), entities }
  }

  queryEntities(filter) {
    const all = Array.from(this.entities.values())
    return filter ? all.filter(filter) : all
  }

  getEntity(id) { return this.entities.get(id) || null }

  fireEvent(entityId, eventName, ...args) {
    const appDef = this.apps.get(entityId)
    const ctx = this.contexts.get(entityId)
    if (!appDef || !ctx) return
    const serverDef = appDef.server || appDef
    if (!serverDef[eventName]) return
    this._safeCall(serverDef, eventName, null, [ctx, ...args], `${eventName}(${entityId})`)
  }

  fireCollision(entityId, other) { this.fireEvent(entityId, 'onCollision', other) }
  fireInteract(entityId, player) { this.fireEvent(entityId, 'onInteract', player) }
  fireMessage(entityId, msg) { this.fireEvent(entityId, 'onMessage', msg) }

  setPlayerManager(pm) { this._playerManager = pm }

  getPlayers() {
    if (this._playerManager) return this._playerManager.getConnectedPlayers()
    return Array.from(this._players.values())
  }

  getNearestPlayer(pos, radius) {
    let nearest = null, minDist = radius * radius
    for (const p of this.getPlayers()) {
      const pp = p.state ? p.state.position : p.position
      if (!pp) continue
      const dx = pp[0] - pos[0], dy = pp[1] - pos[1], dz = pp[2] - pos[2]
      const d = dx * dx + dy * dy + dz * dz
      if (d < minDist) { minDist = d; nearest = p }
    }
    return nearest
  }

  broadcastToPlayers(msg) {
    if (this._playerManager) this._playerManager.broadcast(msg)
  }

  sendToPlayer(id, msg) {
    if (this._playerManager) this._playerManager.sendToPlayer(id, msg)
  }

  hotReload(appName, newDef) {
    this._appDefs.set(appName, newDef)
    for (const [entityId, entity] of this.entities) {
      if (entity._appName !== appName) continue
      const oldApp = this.apps.get(entityId)
      const oldCtx = this.contexts.get(entityId)
      if (oldApp && oldCtx) {
        const oldServer = oldApp.server || oldApp
        this._safeCall(oldServer, 'teardown', null, [oldCtx], 'teardown')
      }
      const ctx = new AppContext(entity, this)
      this.contexts.set(entityId, ctx)
      this.apps.set(entityId, newDef)
      const serverDef = newDef.server || newDef
      this._safeCall(serverDef, 'setup', null, [ctx], `hotReload(${appName})`)
    }
  }

  _safeCall(obj, method, _unused, args, label) {
    if (!obj || !obj[method]) return
    try { obj[method](...args) } catch (e) {
      console.error(`[AppRuntime] ${label}:`, e.message)
    }
  }
}
