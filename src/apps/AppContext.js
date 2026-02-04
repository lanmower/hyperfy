import EventEmitter from 'node:events'

export class AppContext {
  constructor(entity, runtime) {
    this._entity = entity
    this._runtime = runtime
    this._events = new EventEmitter()
    this._state = entity._appState || {}
    entity._appState = this._state
    this._entityProxy = this._buildEntityProxy()
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
      addForce: (f) => {
        const mass = ent.mass || 1
        ent.velocity[0] += f[0] / mass
        ent.velocity[1] += f[1] / mass
        ent.velocity[2] += f[2] / mass
      },
      setVelocity: (v) => { ent.velocity = [...v] },
      raycast: (o, d, dist) => runtime.raycast(o, d, dist)
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
      broadcast: (msg) => runtime.broadcastToPlayers(msg)
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
}
