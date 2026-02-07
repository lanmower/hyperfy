import { AppContext } from './AppContext.js'
import { mulQuat, rotVec } from '../math.js'

export class AppRuntime {
  constructor(config = {}) {
    this.entities = new Map()
    this.apps = new Map()
    this.contexts = new Map()
    this.gravity = config.gravity || [0, -9.81, 0]
    this.currentTick = 0
    this.deltaTime = 0
    this.elapsed = 0
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
      id: entityId, model: config.model || null,
      position: config.position ? [...config.position] : [0, 0, 0],
      rotation: config.rotation || [0, 0, 0, 1],
      scale: config.scale ? [...config.scale] : [1, 1, 1],
      velocity: [0, 0, 0], mass: 1, bodyType: 'static', collider: null,
      parent: null, children: new Set(),
      _appState: null, _appName: config.app || null, _config: config.config || null, custom: null
    }
    this.entities.set(entityId, entity)
    if (config.parent) {
      const p = this.entities.get(config.parent)
      if (p) { entity.parent = config.parent; p.children.add(entityId) }
    }
    if (config.autoTrimesh && entity.model && this._physics) {
      entity.collider = { type: 'trimesh', model: entity.model }
      entity._physicsBodyId = this._physics.addStaticTrimesh(entity.model, 0)
    }
    if (config.app) this._attachApp(entityId, config.app)
    return entity
  }

  _attachApp(entityId, appName) {
    const entity = this.entities.get(entityId), appDef = this._appDefs.get(appName)
    if (!entity || !appDef) return
    const ctx = new AppContext(entity, this)
    this.contexts.set(entityId, ctx)
    this.apps.set(entityId, appDef)
    this._safeCall(appDef.server || appDef, 'setup', [ctx], `setup(${appName})`)
  }

  attachApp(entityId, appName) { this._attachApp(entityId, appName) }

  detachApp(entityId) {
    const appDef = this.apps.get(entityId), ctx = this.contexts.get(entityId)
    if (appDef && ctx) this._safeCall(appDef.server || appDef, 'teardown', [ctx], 'teardown')
    this.clearTimers(entityId)
    this.apps.delete(entityId)
    this.contexts.delete(entityId)
  }

  destroyEntity(entityId) {
    const entity = this.entities.get(entityId)
    if (!entity) return
    for (const childId of [...entity.children]) this.destroyEntity(childId)
    if (entity.parent) {
      const p = this.entities.get(entity.parent)
      if (p) p.children.delete(entityId)
    }
    this.detachApp(entityId)
    this.entities.delete(entityId)
  }

  reparent(entityId, newParentId) {
    const e = this.entities.get(entityId); if (!e) return
    if (e.parent) { const old = this.entities.get(e.parent); if (old) old.children.delete(entityId) }
    e.parent = null
    if (newParentId) { const np = this.entities.get(newParentId); if (np) { e.parent = newParentId; np.children.add(entityId) } }
  }
  getWorldTransform(entityId) {
    const e = this.entities.get(entityId); if (!e) return null
    const local = { position: [...e.position], rotation: [...e.rotation], scale: [...e.scale] }
    if (!e.parent) return local
    const pt = this.getWorldTransform(e.parent); if (!pt) return local
    const sp = [e.position[0]*pt.scale[0], e.position[1]*pt.scale[1], e.position[2]*pt.scale[2]]
    const rp = rotVec(sp, pt.rotation)
    return { position: [pt.position[0]+rp[0], pt.position[1]+rp[1], pt.position[2]+rp[2]], rotation: mulQuat(pt.rotation, e.rotation), scale: [pt.scale[0]*e.scale[0], pt.scale[1]*e.scale[1], pt.scale[2]*e.scale[2]] }
  }

  tick(tickNum, dt) {
    this.currentTick = tickNum
    this.deltaTime = dt
    this.elapsed += dt
    for (const [entityId, appDef] of this.apps) {
      const ctx = this.contexts.get(entityId)
      if (!ctx) continue
      this._safeCall(appDef.server || appDef, 'update', [ctx, dt], `update(${entityId})`)
    }
    this._tickTimers(dt)
    this._tickCollisions()
  }

  getSnapshot() {
    const entities = []
    for (const [id, e] of this.entities) {
      const r = Array.isArray(e.rotation) ? [...e.rotation] : [e.rotation.x || 0, e.rotation.y || 0, e.rotation.z || 0, e.rotation.w || 1]
      entities.push({ id, model: e.model, position: [...e.position], rotation: r, scale: [...e.scale], bodyType: e.bodyType, custom: e.custom || null, parent: e.parent || null })
    }
    return { tick: this.currentTick, timestamp: Date.now(), entities }
  }

  queryEntities(filter) { return filter ? Array.from(this.entities.values()).filter(filter) : Array.from(this.entities.values()) }
  getEntity(id) { return this.entities.get(id) || null }

  fireEvent(entityId, eventName, ...args) {
    const appDef = this.apps.get(entityId), ctx = this.contexts.get(entityId)
    if (!appDef || !ctx) return
    const sd = appDef.server || appDef
    if (sd[eventName]) this._safeCall(sd, eventName, [ctx, ...args], `${eventName}(${entityId})`)
  }

  addTimer(eid, delay, fn, repeat) {
    if (!this._timers.has(eid)) this._timers.set(eid, [])
    this._timers.get(eid).push({ remaining: delay, fn, repeat, interval: delay })
  }
  clearTimers(eid) { this._timers.delete(eid) }
  _tickTimers(dt) {
    for (const [eid, timers] of this._timers) {
      const keep = []
      for (const t of timers) {
        t.remaining -= dt
        if (t.remaining <= 0) {
          try { t.fn() } catch (e) { console.error(`[AppRuntime] timer(${eid}):`, e.message) }
          if (t.repeat) { t.remaining = t.interval; keep.push(t) }
        } else keep.push(t)
      }
      if (keep.length) this._timers.set(eid, keep); else this._timers.delete(eid)
    }
  }
  _tickCollisions() {
    const c = Array.from(this.entities.values()).filter(e => e.collider && this.apps.has(e.id))
    for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) {
      const a = c[i], b = c[j], d = Math.hypot(b.position[0]-a.position[0], b.position[1]-a.position[1], b.position[2]-a.position[2])
      if (d < this._colR(a.collider) + this._colR(b.collider)) {
        this.fireEvent(a.id, 'onCollision', { id: b.id, position: b.position, velocity: b.velocity })
        this.fireEvent(b.id, 'onCollision', { id: a.id, position: a.position, velocity: a.velocity })
      }
    }
  }
  _colR(c) { return !c ? 0 : c.type === 'sphere' ? (c.radius||1) : c.type === 'capsule' ? Math.max(c.radius||0.5,(c.height||1)/2) : c.type === 'box' ? Math.max(...(c.size||c.halfExtents||[1,1,1])) : 1 }
  fireInteract(eid, player) { this.fireEvent(eid, 'onInteract', player) }
  fireMessage(eid, msg) { this.fireEvent(eid, 'onMessage', msg) }
  setPlayerManager(pm) { this._playerManager = pm }
  getPlayers() { return this._playerManager ? this._playerManager.getConnectedPlayers() : [] }
  getNearestPlayer(pos, radius) {
    let nearest = null, minDist = radius * radius
    for (const p of this.getPlayers()) {
      const pp = p.state?.position; if (!pp) continue
      const d = (pp[0]-pos[0])**2 + (pp[1]-pos[1])**2 + (pp[2]-pos[2])**2
      if (d < minDist) { minDist = d; nearest = p }
    }
    return nearest
  }
  broadcastToPlayers(msg) { this._playerManager?.broadcast(msg) }
  sendToPlayer(id, msg) { this._playerManager?.sendToPlayer(id, msg) }
  setPlayerPosition(id, pos) {
    this._physicsIntegration?.setPlayerPosition(id, pos)
    if (this._playerManager) { const p = this._playerManager.getPlayer(id); if (p) p.state.position = [...pos] }
  }

  hotReload(appName, newDef) {
    this._appDefs.set(appName, newDef)
    for (const [eid, ent] of this.entities) {
      if (ent._appName !== appName) continue
      const old = this.apps.get(eid), oldCtx = this.contexts.get(eid)
      if (old && oldCtx) this._safeCall(old.server || old, 'teardown', [oldCtx], 'teardown')
      this.clearTimers(eid)
      const ctx = new AppContext(ent, this)
      this.contexts.set(eid, ctx); this.apps.set(eid, newDef)
      this._safeCall(newDef.server || newDef, 'setup', [ctx], `hotReload(${appName})`)
    }
  }

  _safeCall(obj, method, args, label) {
    if (!obj?.[method]) return
    try { obj[method](...args) } catch (e) { console.error(`[AppRuntime] ${label}:`, e.message) }
  }
}
