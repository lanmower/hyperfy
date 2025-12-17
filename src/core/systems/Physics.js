import * as THREE from '../extras/three.js'
import { extendThreePhysX } from '../extras/extendThreePhysX.js'
import { System } from './System.js'
import { Layers } from '../extras/Layers.js'
import { loadPhysX } from '../loadPhysX.js'
import { PhysicsQueries } from './physics/PhysicsQueries.js'
import { PhysicsContactManager } from './physics/PhysicsContactManager.js'
import { PhysicsActorManager } from './physics/PhysicsActorManager.js'

export class Physics extends System {
  static DEPS = {
    stage: 'stage',
  }

  constructor(world) {
    super(world)
    this.scene = null
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

    this.raycastResult = new PHYSX.PxRaycastResult()
    this.sweepPose = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    this.sweepResult = new PHYSX.PxSweepResult()
    this.overlapPose = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    this.overlapResult = new PHYSX.PxOverlapResult()
    this.queryFilterData = new PHYSX.PxQueryFilterData()

    this._pv1 = new PHYSX.PxVec3()
    this._pv2 = new PHYSX.PxVec3()
    this.transform = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)

    this.queries = new PhysicsQueries(this)
    this.contactManager = new PhysicsContactManager(this)
    this.actorManager = new PhysicsActorManager(this)

    this.getContactCallback = this.contactManager.getContactCallback
    this.queueContactCallback = this.contactManager.queueContactCallback
    this.processContactCallbacks = this.contactManager.processContactCallbacks
    this.getTriggerCallback = this.contactManager.getTriggerCallback
    this.queueTriggerCallback = this.contactManager.queueTriggerCallback
    this.processTriggerCallbacks = this.contactManager.processTriggerCallbacks

    const sceneDesc = new PHYSX.PxSceneDesc(this.tolerances)
    sceneDesc.gravity = new PHYSX.PxVec3(0, -9.81, 0)
    sceneDesc.cpuDispatcher = PHYSX.DefaultCpuDispatcherCreate(0)
    sceneDesc.filterShader = PHYSX.DefaultFilterShader()
    sceneDesc.flags.raise(PHYSX.PxSceneFlagEnum.eENABLE_CCD, true)
    sceneDesc.flags.raise(PHYSX.PxSceneFlagEnum.eENABLE_ACTIVE_ACTORS, true)
    sceneDesc.solverType = PHYSX.PxSolverTypeEnum.eTGS
    sceneDesc.simulationEventCallback = this.contactManager.createSimulationEventCallback()
    sceneDesc.broadPhaseType = PHYSX.PxBroadPhaseTypeEnum.eGPU
    this.scene = this.physics.createScene(sceneDesc)

    this.setupControllerManager()
  }

  setupControllerManager() {
    this.controllerManager = PHYSX.PxTopLevelFunctions.prototype.CreateControllerManager(this.scene) // prettier-ignore
    this.controllerFilters = new PHYSX.PxControllerFilters()
    this.controllerFilters.mFilterData = new PHYSX.PxFilterData(Layers.player.group, Layers.player.mask, 0, 0) // prettier-ignore
    const filterCallback = new PHYSX.PxQueryFilterCallbackImpl()
    filterCallback.simplePreFilter = (filterDataPtr, shapePtr, actor) => {
      const filterData = PHYSX.wrapPointer(filterDataPtr, PHYSX.PxFilterData)
      const shape = PHYSX.wrapPointer(shapePtr, PHYSX.PxShape)
      const shapeFilterData = shape.getQueryFilterData()
      if (filterData.word0 & shapeFilterData.word1 && shapeFilterData.word0 & filterData.word1) {
        return PHYSX.PxQueryHitType.eBLOCK
      }
      return PHYSX.PxQueryHitType.eNONE
    }
    this.controllerFilters.mFilterCallback = filterCallback
    const cctFilterCallback = new PHYSX.PxControllerFilterCallbackImpl()
    cctFilterCallback.filter = (aPtr, bPtr) => {
      return true // for now ALL cct's collide
    }
    this.controllerFilters.mCCTFilterCallback = cctFilterCallback
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
    this.processContactCallbacks()
    this.processTriggerCallbacks()
    const activeActors = PHYSX.SupportFunctions.prototype.PxScene_getActiveActors(this.scene)
    const size = activeActors.size()
    for (let i = 0; i < size; i++) {
      const actorPtr = activeActors.get(i).ptr
      const handle = this.handles.get(actorPtr)
      if (!handle) {
        continue
      }
      const lerp = handle.interpolation
      if (!lerp) continue
      lerp.prev.position.copy(lerp.next.position)
      lerp.prev.quaternion.copy(lerp.next.quaternion)
      const pose = handle.actor.getGlobalPose()
      lerp.next.position.copy(pose.p)
      lerp.next.quaternion.copy(pose.q)
      this.active.add(handle)
    }
  }

  preUpdate(alpha) {
    for (const handle of this.active) {
      const lerp = handle.interpolation
      if (lerp.skip) {
        lerp.skip = false
        continue
      }
      lerp.curr.position.lerpVectors(lerp.prev.position, lerp.next.position, alpha)
      lerp.curr.quaternion.slerpQuaternions(lerp.prev.quaternion, lerp.next.quaternion, alpha)
      handle.onInterpolate(lerp.curr.position, lerp.curr.quaternion)
    }
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
