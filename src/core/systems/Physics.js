import { extendThreePhysX } from '../extras/extendThreePhysX.js'
import { System } from './System.js'
import { loadPhysX } from '../loadPhysX.js'
import { PhysicsQueries } from './physics/PhysicsQueries.js'
import { PhysicsActorManager } from './physics/PhysicsActorManager.js'
import { PhysicsSimulationEvents } from './physics/PhysicsSimulationEvents.js'
import { PhysicsSceneSetup } from './physics/PhysicsSceneSetup.js'
import { PhysicsControllerManager } from './physics/PhysicsControllerManager.js'
import { PhysicsCallbackManager } from './physics/PhysicsCallbackManager.js'
import { PhysicsInterpolationManager } from './physics/PhysicsInterpolationManager.js'


export class Physics extends System {
  static DEPS = {
    stage: 'stage',
  }

  constructor(world) {
    super(world)
    this.scene = null
    this.callbackManager = new PhysicsCallbackManager()
    this.interpolationManager = new PhysicsInterpolationManager(this)
  }

  async init() {
    const info = await loadPhysX()
    this.version = info.version
    this.allocator = info.allocator
    this.errorCb = info.errorCb
    this.foundation = info.foundation

    extendThreePhysX()

    this.tolerances = new PHYSX.PxTolerancesScale()
    this.cookingParams = new PHYSX.PxCookingParams(this.tolerances)
    this.physics = PHYSX.CreatePhysics(this.version, this.foundation, this.tolerances)
    this.defaultMaterial = this.physics.createMaterial(0.2, 0.2, 0.2)

    this.handles = new Map()
    this.active = new Set()
    this.materials = {}

    this.callbackManager.initializeCallbacks()
    this.getContactCallback = this.callbackManager.getContactCallback
    this.getTriggerCallback = this.callbackManager.getTriggerCallback

    this.queries = new PhysicsQueries(this)
    this.actorManager = new PhysicsActorManager(this)
    const events = new PhysicsSimulationEvents(this)

    const sceneSetup = new PhysicsSceneSetup(this)
    this.scene = sceneSetup.createScene(events)

    const controllerMgr = new PhysicsControllerManager(this)
    controllerMgr.setup()
  }

  start() {
  }

  addActor(actor, handle) {
    return this.actorManager.addActor(actor, handle)
  }

  preFixedUpdate(willFixedUpdate) {
    if (willFixedUpdate) {
      this.active.clear()
    }
  }

  postFixedUpdate(delta) {
    this.scene.simulate(delta)
    this.scene.fetchResults(true)
    this.callbackManager.processContactCallbacks()
    this.callbackManager.processTriggerCallbacks()
    this.interpolationManager.processActiveActors(this.scene, this.handles, this.active)
  }

  preUpdate(alpha) {
    this.interpolationManager.interpolateActive(this.active, alpha)
    this.ignoreSetGlobalPose = true
    this.stage.clean()
    this.ignoreSetGlobalPose = false
  }

  raycast(origin, direction, maxDistance = Infinity, layerMask) {
    return this.queries.raycast(origin, direction, maxDistance, layerMask)
  }

  sweep(geometry, origin, direction, maxDistance, layerMask) {
    return this.queries.sweep(geometry, origin, direction, maxDistance, layerMask)
  }

  overlapSphere(radius, origin, layerMask) {
    return this.queries.overlapSphere(radius, origin, layerMask)
  }

  queueContactCallback = cb => {
    this.callbackManager.queueContactCallback(cb)
  }

  queueTriggerCallback = cb => {
    this.callbackManager.queueTriggerCallback(cb)
  }


  getMaterial(staticFriction, dynamicFriction, restitution) {
    const id = `${staticFriction}${dynamicFriction}${restitution}`
    let material = this.materials[id]
    if (!material) {
      material = this.physics.createMaterial(staticFriction, dynamicFriction, restitution)
      this.materials[id] = material
    }
    return material
  }
}
