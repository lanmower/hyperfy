import { EventEmitter } from '../protocol/EventEmitter.js'
import { CliDebugger } from '../debug/CliDebugger.js'
import { ColliderFitter } from '../physics/ColliderFitter.js'

export class AppContext {
  constructor(entity, runtime) {
    this._entity = entity
    this._runtime = runtime
    this._events = new EventEmitter()
    this._state = entity._appState || {}
    entity._appState = this._state
    this._entityProxy = this._buildEntityProxy()
    this._debugger = new CliDebugger(`[${entity.id}]`)
  }

  _buildEntityProxy() {
    const ent = this._entity
    const runtime = this._runtime
    return {
      get id() { return ent.id },
      get model() { return ent.model },
      get position() { return ent.position },
      set position(v) { ent.position = v },
      get rotation() { return ent.rotation },
      set rotation(v) { ent.rotation = v },
      get scale() { return ent.scale },
      set scale(v) { ent.scale = v },
      get velocity() { return ent.velocity },
      set velocity(v) { ent.velocity = v },
      get custom() { return ent.custom },
      set custom(v) { ent.custom = v },
      destroy: () => runtime.destroyEntity(ent.id)
    }
  }

  get entity() { return this._entityProxy }

  get physics() {
    const ent = this._entity
    const runtime = this._runtime
    return {
      setStatic: (v) => { ent.bodyType = v ? 'static' : ent.bodyType },
      setDynamic: (v) => { ent.bodyType = v ? 'dynamic' : ent.bodyType },
      setKinematic: (v) => { ent.bodyType = v ? 'kinematic' : ent.bodyType },
      setMass: (v) => { ent.mass = v },
      addBoxCollider: (s) => { ent.collider = { type: 'box', size: s } },
      addSphereCollider: (r) => { ent.collider = { type: 'sphere', radius: r } },
      addCapsuleCollider: (r, h) => { ent.collider = { type: 'capsule', radius: r, height: h } },
      addMeshCollider: (m) => { ent.collider = { type: 'mesh', mesh: m } },
      addTrimeshCollider: () => {
        ent.collider = { type: 'trimesh', model: ent.model }
        if (runtime._physics && ent.model) {
          const bodyId = runtime._physics.addStaticTrimesh(ent.model, 0)
          ent._physicsBodyId = bodyId
        }
      },
      addForce: (f) => {
        const mass = ent.mass || 1
        ent.velocity[0] += f[0] / mass
        ent.velocity[1] += f[1] / mass
        ent.velocity[2] += f[2] / mass
      },
      setVelocity: (v) => { ent.velocity = [...v] }
    }
  }

  get world() {
    const runtime = this._runtime
    return {
      spawn: (id, cfg) => runtime.spawnEntity(id, cfg),
      destroy: (id) => runtime.destroyEntity(id),
      query: (filter) => runtime.queryEntities(filter),
      getEntity: (id) => runtime.getEntity(id),
      get gravity() { return runtime.gravity }
    }
  }

  get players() {
    const runtime = this._runtime
    return {
      getAll: () => runtime.getPlayers(),
      getNearest: (pos, r) => runtime.getNearestPlayer(pos, r),
      send: (pid, msg) => runtime.sendToPlayer(pid, msg),
      broadcast: (msg) => runtime.broadcastToPlayers(msg),
      setPosition: (pid, pos) => runtime.setPlayerPosition(pid, pos)
    }
  }

  get time() {
    const runtime = this._runtime
    return {
      get tick() { return runtime.currentTick },
      get deltaTime() { return runtime.deltaTime },
      get elapsed() { return runtime.elapsed }
    }
  }

  get state() { return this._state }
  set state(v) { Object.assign(this._state, v) }

  get events() {
    const ev = this._events
    return {
      emit: (n, d) => ev.emit(n, d),
      on: (n, fn) => ev.on(n, fn),
      off: (n, fn) => ev.off(n, fn),
      once: (n, fn) => ev.once(n, fn)
    }
  }

  get network() {
    const runtime = this._runtime
    return {
      broadcast: (msg) => runtime.broadcastToPlayers(msg),
      sendTo: (id, msg) => runtime.sendToPlayer(id, msg)
    }
  }

  get debug() { return this._debugger }

  get collider() {
    const ent = this._entity
    return {
      fitToModel: () => {
        if (!ent.model) return
        const analysis = ColliderFitter.analyzeMesh(ent.model, 0)
        const rec = ColliderFitter.recommend(analysis)
        if (rec.type === 'box') ent.collider = { type: 'box', halfExtents: rec.halfExtents }
        else if (rec.type === 'capsule') ent.collider = { type: 'capsule', radius: rec.radius, halfHeight: rec.halfHeight }
        else ent.collider = { type: 'sphere', radius: rec.radius }
        return rec
      },
      box: (hx, hy, hz) => { ent.collider = { type: 'box', halfExtents: [hx, hy, hz] } },
      capsule: (r, h) => { ent.collider = { type: 'capsule', radius: r, halfHeight: h } },
      sphere: (r) => { ent.collider = { type: 'sphere', radius: r } }
    }
  }

  raycast(origin, direction, maxDistance = 1000) {
    if (this._runtime._physics) {
      return this._runtime._physics.raycast(origin, direction, maxDistance)
    }
    return { hit: false, distance: maxDistance, body: null, position: null }
  }
}
