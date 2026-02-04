import { AppContext } from './AppContext.js'

export class AppRuntime {
  constructor(config = {}) {
    this.entities = new Map()
    this.apps = new Map()
    this.contexts = new Map()
    this.renderHints = new Map()
    this.gravity = config.gravity || [0, -9.81, 0]
    this.currentTick = 0
    this.deltaTime = 0
    this.elapsed = 0
    this._players = new Map()
    this._playerManager = config.playerManager || null
    this._nextEntityId = 1
    this._appDefs = new Map()
  }

  registerApp(name, appDef) { this._appDefs.set(name, appDef) }

  spawnEntity(id, config = {}) {
    const entityId = id || `entity_${this._nextEntityId++}`
    const entity = {
      id: entityId, model: config.model || null,
      position: config.position ? [...config.position] : [0, 0, 0],
      rotation: config.rotation || { x: 0, y: 0, z: 0, w: 1 },
      scale: config.scale ? [...config.scale] : [1, 1, 1],
      velocity: [0, 0, 0], mass: 1, bodyType: 'static',
      collider: null, _appState: null, _appName: config.app || null
    }
    this.entities.set(entityId, entity)
    if (config.app) this._attachApp(entityId, config.app)
    return entity
  }

  _attachApp(entityId, appName) {
    const entity = this.entities.get(entityId)
    const appDef = this._appDefs.get(appName)
    if (!entity || !appDef) return
    const ctx = new AppContext(entity, this)
    this.contexts.set(entityId, ctx)
    this.apps.set(entityId, appDef)
    this._safeCall(appDef, 'setup', ctx, [ctx], `setup(${appName})`)
  }

  attachApp(entityId, appName) { this._attachApp(entityId, appName) }

  detachApp(entityId) {
    const appDef = this.apps.get(entityId)
    const ctx = this.contexts.get(entityId)
    if (appDef && ctx) this._safeCall(appDef, 'teardown', ctx, [ctx], 'teardown')
    this.apps.delete(entityId)
    this.contexts.delete(entityId)
    this.renderHints.delete(entityId)
  }

  destroyEntity(entityId) {
    this.detachApp(entityId)
    this.entities.delete(entityId)
  }

  tick(tickNum, dt) {
    this.currentTick = tickNum
    this.deltaTime = dt
    this.elapsed += dt
    this._updatePhysics(dt)
    for (const [entityId, appDef] of this.apps) {
      const ctx = this.contexts.get(entityId)
      if (!ctx) continue
      this._safeCall(appDef, 'update', ctx, [ctx, dt], `update(${entityId})`)
      if (appDef.render) {
        try { this.renderHints.set(entityId, appDef.render(ctx)) }
        catch (e) { console.error(`[AppRuntime] render ${entityId}:`, e.message) }
      }
    }
  }

  _updatePhysics(dt) {
    const gy = this.gravity[1]
    for (const entity of this.entities.values()) {
      if (entity.bodyType !== 'dynamic') continue
      entity.velocity[1] += gy * dt
      entity.position[0] += entity.velocity[0] * dt
      entity.position[1] += entity.velocity[1] * dt
      entity.position[2] += entity.velocity[2] * dt
      if (entity.position[1] < 0) { entity.position[1] = 0; entity.velocity[1] = 0 }
    }
  }

  getSnapshot() {
    const entities = []
    for (const [id, entity] of this.entities) {
      const hint = this.renderHints.get(id) || {}
      entities.push({
        id, model: entity.model,
        position: [...entity.position], rotation: entity.rotation,
        scale: [...entity.scale], velocity: [...entity.velocity],
        bodyType: entity.bodyType,
        animation: hint.animation || null, effects: hint.effects || null,
        sound: hint.sound || null, custom: hint.custom || null
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
    if (!appDef || !ctx || !appDef[eventName]) return
    this._safeCall(appDef, eventName, ctx, [ctx, ...args], `${eventName}(${entityId})`)
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

  raycast(origin, direction, distance) {
    return { hit: false, distance, body: null }
  }

  hotReload(appName, newDef) {
    this._appDefs.set(appName, newDef)
    for (const [entityId, entity] of this.entities) {
      if (entity._appName !== appName) continue
      const oldApp = this.apps.get(entityId)
      const oldCtx = this.contexts.get(entityId)
      if (oldApp && oldCtx) this._safeCall(oldApp, 'teardown', oldCtx, [oldCtx], 'teardown')
      const ctx = new AppContext(entity, this)
      this.contexts.set(entityId, ctx)
      this.apps.set(entityId, newDef)
      this._safeCall(newDef, 'setup', ctx, [ctx], `hotReload(${appName})`)
    }
  }

  _safeCall(obj, method, ctx, args, label) {
    if (!obj[method]) return
    try { obj[method](...args) } catch (e) {
      console.error(`[AppRuntime] ${label}:`, e.message)
    }
  }
}
