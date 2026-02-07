import initJolt from 'jolt-physics/wasm-compat'
import { extractMeshFromGLB } from './GLBLoader.js'
const LAYER_STATIC = 0, LAYER_DYNAMIC = 1, NUM_LAYERS = 2
let joltInstance = null
async function getJolt() { if (!joltInstance) joltInstance = await initJolt(); return joltInstance }
export class PhysicsWorld {
  constructor(config = {}) {
    this.gravity = config.gravity || [0, -9.81, 0]
    this.Jolt = null; this.jolt = null; this.physicsSystem = null; this.bodyInterface = null
    this.bodies = new Map(); this.bodyMeta = new Map()
    this._objFilter = null; this._ovbp = null
  }
  async init() {
    const J = await getJolt()
    this.Jolt = J
    const settings = new J.JoltSettings()
    const objFilter = new J.ObjectLayerPairFilterTable(NUM_LAYERS)
    objFilter.EnableCollision(LAYER_STATIC, LAYER_DYNAMIC); objFilter.EnableCollision(LAYER_DYNAMIC, LAYER_DYNAMIC)
    const bpI = new J.BroadPhaseLayerInterfaceTable(NUM_LAYERS, 2)
    bpI.MapObjectToBroadPhaseLayer(LAYER_STATIC, new J.BroadPhaseLayer(0))
    bpI.MapObjectToBroadPhaseLayer(LAYER_DYNAMIC, new J.BroadPhaseLayer(1))
    const ovbp = new J.ObjectVsBroadPhaseLayerFilterTable(bpI, 2, objFilter, NUM_LAYERS)
    settings.mObjectLayerPairFilter = objFilter; settings.mBroadPhaseLayerInterface = bpI
    settings.mObjectVsBroadPhaseLayerFilter = ovbp
    this._objFilter = objFilter; this._ovbp = ovbp
    this.jolt = new J.JoltInterface(settings); J.destroy(settings)
    this.physicsSystem = this.jolt.GetPhysicsSystem(); this.bodyInterface = this.physicsSystem.GetBodyInterface()
    const [gx, gy, gz] = this.gravity
    this.physicsSystem.SetGravity(new J.Vec3(gx, gy, gz))
    return this
  }
  _addBody(shape, position, motionType, layer, opts = {}) {
    const J = this.Jolt
    const pos = new J.RVec3(position[0], position[1], position[2])
    const rot = opts.rotation ? new J.Quat(...opts.rotation) : new J.Quat(0, 0, 0, 1)
    const cs = new J.BodyCreationSettings(shape, pos, rot, motionType, layer)
    if (opts.mass) { cs.mMassPropertiesOverride.mMass = opts.mass; cs.mOverrideMassProperties = J.EOverrideMassProperties_CalculateInertia }
    if (opts.friction !== undefined) cs.mFriction = opts.friction
    if (opts.restitution !== undefined) cs.mRestitution = opts.restitution
    const activate = motionType === J.EMotionType_Static ? J.EActivation_DontActivate : J.EActivation_Activate
    const body = this.bodyInterface.CreateBody(cs); this.bodyInterface.AddBody(body.GetID(), activate)
    J.destroy(cs)
    const id = body.GetID().GetIndexAndSequenceNumber()
    this.bodies.set(id, body); this.bodyMeta.set(id, opts.meta || {})
    return id
  }
  addStaticBox(halfExtents, position, rotation) {
    const J = this.Jolt
    const shape = new J.BoxShape(new J.Vec3(halfExtents[0], halfExtents[1], halfExtents[2]), 0.05, null)
    return this._addBody(shape, position, J.EMotionType_Static, LAYER_STATIC, { rotation, meta: { type: 'static', shape: 'box' } })
  }
  addStaticTrimesh(glbPath, meshIndex = 0) {
    const J = this.Jolt
    const mesh = extractMeshFromGLB(glbPath, meshIndex)
    const triangles = new J.TriangleList(); triangles.resize(mesh.triangleCount)
    for (let t = 0; t < mesh.triangleCount; t++) {
      const tri = triangles.at(t)
      for (let v = 0; v < 3; v++) {
        const idx = mesh.indices[t * 3 + v]
        tri.set_mV(v, new J.Float3(mesh.vertices[idx * 3], mesh.vertices[idx * 3 + 1], mesh.vertices[idx * 3 + 2]))
      }
    }
    const shape = new J.MeshShapeSettings(triangles).Create().Get()
    return this._addBody(shape, [0, 0, 0], J.EMotionType_Static, LAYER_STATIC, { meta: { type: 'static', shape: 'trimesh', mesh: mesh.name, triangles: mesh.triangleCount } })
  }
  addDynamicCapsule(radius, halfHeight, position, mass) {
    const J = this.Jolt
    return this._addBody(new J.CapsuleShape(halfHeight, radius, null), position, J.EMotionType_Dynamic, LAYER_DYNAMIC, { mass: mass || 80, friction: 0.5, restitution: 0.0, meta: { type: 'dynamic', shape: 'capsule', radius, height: halfHeight * 2 } })
  }
  addPlayerCapsule(radius, halfHeight, position, mass) {
    const J = this.Jolt
    const shape = new J.CapsuleShape(halfHeight, radius)
    const pos = new J.RVec3(position[0], position[1], position[2])
    const rot = new J.Quat(0, 0, 0, 1)
    const cs = new J.BodyCreationSettings(shape, pos, rot, J.EMotionType_Dynamic, LAYER_DYNAMIC)
    cs.mMassPropertiesOverride.mMass = mass || 80
    cs.mOverrideMassProperties = J.EOverrideMassProperties_CalculateInertia
    cs.mFriction = 0.5
    cs.mRestitution = 0.0
    cs.mAllowedDOFs = J.EAllowedDOFs_TranslationX | J.EAllowedDOFs_TranslationY | J.EAllowedDOFs_TranslationZ
    const body = this.bodyInterface.CreateBody(cs)
    this.bodyInterface.AddBody(body.GetID(), J.EActivation_Activate)
    J.destroy(cs)
    const id = body.GetID().GetIndexAndSequenceNumber()
    this.bodies.set(id, body)
    this.bodyMeta.set(id, { type: 'player', shape: 'capsule', radius, halfHeight })
    return id
  }
  _getBody(bodyId) { return this.bodies.get(bodyId) }
  getBodyPosition(bodyId) {
    const b = this._getBody(bodyId); if (!b) return [0, 0, 0]
    const p = this.bodyInterface.GetPosition(b.GetID()); return [p.GetX(), p.GetY(), p.GetZ()]
  }
  getBodyRotation(bodyId) {
    const b = this._getBody(bodyId); if (!b) return [0, 0, 0, 1]
    const r = this.bodyInterface.GetRotation(b.GetID()); return [r.GetX(), r.GetY(), r.GetZ(), r.GetW()]
  }
  getBodyVelocity(bodyId) {
    const b = this._getBody(bodyId); if (!b) return [0, 0, 0]
    const v = this.bodyInterface.GetLinearVelocity(b.GetID()); return [v.GetX(), v.GetY(), v.GetZ()]
  }
  setBodyPosition(bodyId, position) {
    const b = this._getBody(bodyId); if (!b) return
    this.bodyInterface.SetPosition(b.GetID(), new this.Jolt.RVec3(position[0], position[1], position[2]), this.Jolt.EActivation_Activate)
  }
  setBodyVelocity(bodyId, velocity) {
    const b = this._getBody(bodyId); if (!b) return
    this.bodyInterface.SetLinearVelocity(b.GetID(), new this.Jolt.Vec3(velocity[0], velocity[1], velocity[2]))
  }
  addForce(bodyId, force) {
    const b = this._getBody(bodyId); if (!b) return
    this.bodyInterface.AddForce(b.GetID(), new this.Jolt.Vec3(force[0], force[1], force[2]))
  }
  addImpulse(bodyId, impulse) {
    const b = this._getBody(bodyId); if (!b) return
    this.bodyInterface.AddImpulse(b.GetID(), new this.Jolt.Vec3(impulse[0], impulse[1], impulse[2]))
  }
  step(deltaTime) { if (!this.jolt) return; this.jolt.Step(deltaTime, deltaTime > 1 / 55 ? 2 : 1) }
  removeBody(bodyId) {
    const b = this._getBody(bodyId); if (!b) return
    this.bodyInterface.RemoveBody(b.GetID()); this.bodyInterface.DestroyBody(b.GetID())
    this.bodies.delete(bodyId); this.bodyMeta.delete(bodyId)
  }
  raycast(origin, direction, maxDistance = 1000, excludeBodyId = null) {
    if (!this.physicsSystem) return { hit: false, distance: maxDistance, body: null, position: null }
    const J = this.Jolt
    const len = Math.sqrt(direction[0] * direction[0] + direction[1] * direction[1] + direction[2] * direction[2])
    const dir = len > 0 ? [direction[0] / len, direction[1] / len, direction[2] / len] : direction
    const rayOrigin = new J.RVec3(origin[0], origin[1], origin[2])
    const rayDir = new J.Vec3(dir[0] * maxDistance, dir[1] * maxDistance, dir[2] * maxDistance)
    const ray = new J.RRayCast(rayOrigin, rayDir)
    const raySettings = new J.RayCastSettings()
    const collector = new J.CastRayClosestHitCollisionCollector()
    const bpFilter = new J.DefaultBroadPhaseLayerFilter(this._ovbp, LAYER_DYNAMIC)
    const objLayerFilter = new J.DefaultObjectLayerFilter(this._objFilter, LAYER_DYNAMIC)
    let bodyFilter
    if (excludeBodyId != null) {
      const excludeBody = this._getBody(excludeBodyId)
      bodyFilter = excludeBody ? new J.IgnoreSingleBodyFilter(excludeBody.GetID()) : new J.BodyFilter()
    } else {
      bodyFilter = new J.BodyFilter()
    }
    const shapeFilter = new J.ShapeFilter()
    this.physicsSystem.GetNarrowPhaseQuery().CastRay(ray, raySettings, collector, bpFilter, objLayerFilter, bodyFilter, shapeFilter)
    let result
    if (collector.HadHit()) {
      const hit = collector.get_mHit()
      const dist = hit.mFraction * maxDistance
      const hitPos = [origin[0] + dir[0] * dist, origin[1] + dir[1] * dist, origin[2] + dir[2] * dist]
      result = { hit: true, distance: dist, body: null, position: hitPos }
    } else {
      result = { hit: false, distance: maxDistance, body: null, position: null }
    }
    J.destroy(ray); J.destroy(raySettings); J.destroy(collector)
    J.destroy(bpFilter); J.destroy(objLayerFilter); J.destroy(bodyFilter); J.destroy(shapeFilter)
    return result
  }
  destroy() { for (const [id] of this.bodies) this.removeBody(id); if (this.jolt) { this.Jolt.destroy(this.jolt); this.jolt = null } }
}
