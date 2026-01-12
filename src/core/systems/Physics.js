import { extendThreePhysX } from '../extras/extendThreePhysX.js'
import { System } from './System.js'
import { loadPhysX } from '../loadPhysX.js'
import { PhysicsQueries } from './physics/PhysicsQueries.js'
import { PhysicsCoordinator } from './physics/PhysicsCoordinator.js'
import { PhysicsSimulationEvents } from './physics/PhysicsSimulationEvents.js'
import { Layers } from '../extras/Layers.js'
import { StructuredLogger } from '../utils/logging/index.js'
import { tracer } from '../utils/tracing/index.js'

const logger = new StructuredLogger('Physics')

export class Physics extends System {
  static DEPS = {
    stage: 'stage',
  }

  constructor(world) {
    super(world)
    this.scene = null
    this.coordinator = new PhysicsCoordinator(this)
    this.active = new Set()
  }

  async init() {
    try {
      const info = await loadPhysX()
      this.version = info.version
      this.allocator = info.allocator
      this.errorCb = info.errorCb
      this.foundation = info.foundation

      logger.info('PhysX module loaded', { version: this.version })
      logger.info('PhysX availability check', { physxAvailable: !!globalThis.PHYSX, version: globalThis.PHYSX?.PHYSICS_VERSION })

      if (!globalThis.PHYSX) {
        throw new Error('PhysX module failed to initialize - globalThis.PHYSX is undefined')
      }

      this.world.PHYSX = globalThis.PHYSX
      logger.info('PhysX set on world for access by systems')
    } catch (err) {
      logger.error('Failed to load PhysX', { error: err.message || err.toString() })
      return
    }

    if (!this.foundation) {
      logger.error('Foundation not initialized after PhysX load')
      return
    }

    extendThreePhysX()

    this.tolerances = new PHYSX.PxTolerancesScale()
    this.cookingParams = new PHYSX.PxCookingParams(this.tolerances)
    this.physics = PHYSX.CreatePhysics(this.version, this.foundation, this.tolerances)
    this.defaultMaterial = this.physics.createMaterial(0.2, 0.2, 0.2)

    this.handles = new Map()
    this.materials = {}

    this.coordinator.initialize()
    this.coordinator.initializeCallbacks()
    this.actorManager = this.coordinator.actorManager
    this.callbackManager = this.coordinator.callbackManager
    this.interpolationManager = this.coordinator.interpolationManager
    this.getContactCallback = this.coordinator.getContactCallback
    this.getTriggerCallback = this.coordinator.getTriggerCallback
    this.contactCallbacks = this.coordinator.contactCallbacks
    this.triggerCallbacks = this.coordinator.triggerCallbacks

    this.queries = new PhysicsQueries(this)
    this.coordinator.setQueries(this.queries)
    const events = new PhysicsSimulationEvents(this)

    const sceneDesc = new PHYSX.PxSceneDesc(this.tolerances)
    sceneDesc.gravity = new PHYSX.PxVec3(0, -9.81, 0)
    sceneDesc.cpuDispatcher = PHYSX.DefaultCpuDispatcherCreate(0)
    sceneDesc.filterShader = PHYSX.DefaultFilterShader()
    sceneDesc.flags.raise(PHYSX.PxSceneFlagEnum.eENABLE_CCD, true)
    sceneDesc.flags.raise(PHYSX.PxSceneFlagEnum.eENABLE_ACTIVE_ACTORS, true)
    sceneDesc.solverType = PHYSX.PxSolverTypeEnum.eTGS
    sceneDesc.simulationEventCallback = events.createSimulationEventCallback()
    sceneDesc.broadPhaseType = PHYSX.PxBroadPhaseTypeEnum.eGPU
    this.scene = this.physics.createScene(sceneDesc)

    this.controllerManager = PHYSX.PxTopLevelFunctions.prototype.CreateControllerManager(this.scene)
    this.controllerFilters = new PHYSX.PxControllerFilters()
    this.controllerFilters.mFilterData = new PHYSX.PxFilterData(Layers.player.group, Layers.player.mask, 0, 0)
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
      return true
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
    if (!this.scene) return

    const span = tracer.startSpan(`physics_step`, null)
    span?.setAttribute('delta', delta)

    try {
      const simulateSpan = tracer.startSpan(`physics_simulate`, span?.traceId)
      this.scene.simulate(delta)
      tracer.endSpan(simulateSpan)

      const fetchSpan = tracer.startSpan(`physics_fetch_results`, span?.traceId)
      this.scene.fetchResults(true)
      tracer.endSpan(fetchSpan)

      const contactSpan = tracer.startSpan(`physics_contact_callbacks`, span?.traceId)
      this.callbackManager.processContactCallbacks()
      tracer.endSpan(contactSpan)

      const triggerSpan = tracer.startSpan(`physics_trigger_callbacks`, span?.traceId)
      this.callbackManager.processTriggerCallbacks()
      tracer.endSpan(triggerSpan)

      const interpolateSpan = tracer.startSpan(`physics_interpolation`, span?.traceId)
      this.interpolationManager.processActiveActors(this.scene, this.handles, this.active)
      tracer.endSpan(interpolateSpan)

      span?.setAttribute('activeActors', this.active.size)
      span?.setAttribute('status', 'success')
      tracer.endSpan(span)
    } catch (err) {
      span?.setAttribute('status', 'error')
      tracer.endSpan(span, 'error', err)
      throw err
    }
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
