import * as THREE from '../extras/three.js'
import { extendThreePhysX } from '../extras/extendThreePhysX.js'
import { System } from './System.js'
import { Layers } from '../extras/Layers.js'
import { loadPhysX } from '../loadPhysX.js'
import { PhysicsQueries } from './physics/PhysicsQueries.js'
import { PhysicsActorManager } from './physics/PhysicsActorManager.js'
import { PhysicsSimulationEvents } from './physics/PhysicsSimulationEvents.js'
import { PhysicsSceneSetup } from './physics/PhysicsSceneSetup.js'
import { PhysicsControllerManager } from './physics/PhysicsControllerManager.js'

const contactCallbacks = []
const triggerCallbacks = []

function createPool(factory) {
  const pool = []
  return () => {
    if (pool.length) {
      return pool.pop()
    }
    const item = factory()
    item.release = () => pool.push(item)
    return item
  }
}


export class Physics extends System {
  static DEPS = {
    stage: 'stage',
  }

  constructor(world) {
    super(world)
    this.scene = null
    this.contactCallbacks = []
    this.triggerCallbacks = []
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

    this.initializeContactCallbacks()

    this.queries = new PhysicsQueries(this)
    this.actorManager = new PhysicsActorManager(this)
    const events = new PhysicsSimulationEvents(this)

    const sceneSetup = new PhysicsSceneSetup(this)
    this.scene = sceneSetup.createScene(events)

    const controllerMgr = new PhysicsControllerManager(this)
    controllerMgr.setup()
  }

  initializeContactCallbacks() {
    this.getContactCallback = createPool(() => {
      const contactPool = []
      const contacts = []
      let idx = 0
      return {
        start: false,
        fn0: null,
        event0: {
          tag: null,
          playerId: null,
          contacts,
        },
        fn1: null,
        event1: {
          tag: null,
          playerId: null,
          contacts,
        },
        addContact(position, normal, impulse) {
          if (!contactPool[idx]) {
            contactPool[idx] = {
              position: new THREE.Vector3(),
              normal: new THREE.Vector3(),
              impulse: new THREE.Vector3(),
            }
          }
          const contact = contactPool[idx]
          contact.position.copy(position)
          contact.normal.copy(normal)
          contact.impulse.copy(impulse)
          contacts.push(contact)
          idx++
        },
        init(start) {
          this.start = start
          this.fn0 = null
          this.fn1 = null
          contacts.length = 0
          idx = 0
          return this
        },
        exec() {
          if (this.fn0) {
            try {
              this.fn0(this.event0)
            } catch (err) {
              console.error(err)
            }
          }
          if (this.fn1) {
            try {
              this.fn1(this.event1)
            } catch (err) {
              console.error(err)
            }
          }
          this.release()
        },
      }
    })

    this.getTriggerCallback = createPool(() => {
      return {
        fn: null,
        event: {
          tag: null,
          playerId: null,
        },
        exec() {
          try {
            this.fn(this.event)
          } catch (err) {
            console.error(err)
          }
          this.release()
        },
      }
    })
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

  queueContactCallback = cb => {
    this.contactCallbacks.push(cb)
  }

  processContactCallbacks = () => {
    for (const cb of this.contactCallbacks) {
      cb.exec()
    }
    this.contactCallbacks.length = 0
  }

  queueTriggerCallback = cb => {
    this.triggerCallbacks.push(cb)
  }

  processTriggerCallbacks = () => {
    for (const cb of this.triggerCallbacks) {
      cb.exec()
    }
    this.triggerCallbacks.length = 0
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
