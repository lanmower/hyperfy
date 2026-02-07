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
    this._physicsIntegration = config.physicsIntegration || null
    this._nextEntityId = 1
    this._appDefs = new Map()
    this._timers = new Map()
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
      _config: config.config || null,
      custom: null
    }
    this.entities.set(entityId, entity)
    if (config.autoTrimesh && entity.model && this._physics) {
      entity.collider = { type: 'trimesh', model: entity.model }
      entity._physicsBodyId = this._physics.addStaticTrimesh(entity.model, 0)
    }
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
    this.clearTimers(entityId)
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
    this._tickTimers(dt)
    this._tickCollisions()
  }

  getSnapshot() {
    const entities = []
    for (const [id, e] of this.entities) {
      const r = Array.isArray(e.rotation) ? [...e.rotation] : [e.rotation.x || 0, e.rotation.y || 0, e.rotation.z || 0, e.rotation.w || 1]
      entities.push({ id, model: e.model, position: [...e.position], rotation: r, scale: [...e.scale], bodyType: e.bodyType, custom: e.custom || null })
    }
    return { tick: this.currentTick, timestamp: Date.now(), entities }
  }
  queryEntities(filter) { const a = Array.from(this.entities.values()); return filter ? a.filter(filter) : a }
  getEntity(id) { return this.entities.get(id) || null }
  fireEvent(entityId, eventName, ...args) {
    const appDef = this.apps.get(entityId), ctx = this.contexts.get(entityId)
    if (!appDef || !ctx) return
    const sd = appDef.server || appDef
    if (!sd[eventName]) return
    this._safeCall(sd, eventName, null, [ctx, ...args], `${eventName}(${entityId})`)
  }

  addTimer(entityId, delay, fn, repeat) {
    if (!this._timers.has(entityId)) this._timers.set(entityId, [])
    const timer = { remaining: delay, fn, repeat, interval: delay }
    this._timers.get(entityId).push(timer)
    return timer
  }
  clearTimers(entityId) { this._timers.delete(entityId) }
  _tickTimers(dt) {
    for (const [entityId, timers] of this._timers) {
      const keep = []
      for (const t of timers) {
        t.remaining -= dt
        if (t.remaining <= 0) {
          try { t.fn() } catch (e) { console.error(`[AppRuntime] timer(${entityId}):`, e.message) }
          if (t.repeat) { t.remaining = t.interval; keep.push(t) }
        } else { keep.push(t) }
      }
      if (keep.length > 0) this._timers.set(entityId, keep)
      else this._timers.delete(entityId)
    }
  }

  _tickCollisions() {
    const cols = []
    for (const [id, ent] of this.entities) { if (ent.collider && this.apps.has(id)) cols.push(ent) }
    for (let i = 0; i < cols.length; i++) {
      for (let j = i + 1; j < cols.length; j++) {
        const a = cols[i], b = cols[j]
        const ra = this._colliderRadius(a.collider), rb = this._colliderRadius(b.collider)
        const dist = Math.hypot(b.position[0] - a.position[0], b.position[1] - a.position[1], b.position[2] - a.position[2])
        if (dist < ra + rb) {
          this.fireCollision(a.id, { id: b.id, position: b.position, velocity: b.velocity })
          this.fireCollision(b.id, { id: a.id, position: a.position, velocity: a.velocity })
        }
      }
    }
  }
  _colliderRadius(c) {
    if (!c) return 0
    if (c.type === 'sphere') return c.radius || 1
    if (c.type === 'capsule') return Math.max(c.radius || 0.5, (c.height || 1) / 2)
    if (c.type === 'box') return Math.max(...(c.size || c.halfExtents || [1, 1, 1]))
    return 1
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
  broadcastToPlayers(msg) { if (this._playerManager) this._playerManager.broadcast(msg) }
  sendToPlayer(id, msg) { if (this._playerManager) this._playerManager.sendToPlayer(id, msg) }
  setPlayerPosition(id, position) {
    if (this._physicsIntegration) this._physicsIntegration.setPlayerPosition(id, position)
    if (this._playerManager) { const p = this._playerManager.getPlayer(id); if (p) p.state.position = [...position] }
  }

  hotReload(appName, newDef) {
    this._appDefs.set(appName, newDef)
    for (const [eid, ent] of this.entities) {
      if (ent._appName !== appName) continue
      const old = this.apps.get(eid), oldCtx = this.contexts.get(eid)
      if (old && oldCtx) this._safeCall(old.server || old, 'teardown', null, [oldCtx], 'teardown')
      this.clearTimers(eid)
      const ctx = new AppContext(ent, this)
      this.contexts.set(eid, ctx); this.apps.set(eid, newDef)
      this._safeCall(newDef.server || newDef, 'setup', null, [ctx], `hotReload(${appName})`)
    }
  }
  _safeCall(obj, method, _unused, args, label) {
    if (!obj || !obj[method]) return
    try { obj[method](...args) } catch (e) { console.error(`[AppRuntime] ${label}:`, e.message) }
  }
}
