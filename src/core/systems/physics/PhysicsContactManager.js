import * as THREE from '../../extras/three.js'

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

export class PhysicsContactManager {
  constructor(physics) {
    this.physics = physics
    this.contactCallbacks = []
    this.triggerCallbacks = []
    this.initialize()
  }

  initialize() {
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

  createSimulationEventCallback() {
    const contactPoints = new PHYSX.PxArray_PxContactPairPoint(64)
    const simulationEventCallback = new PHYSX.PxSimulationEventCallbackImpl()

    simulationEventCallback.onContact = (pairHeader, pairs, count) => {
      pairHeader = PHYSX.wrapPointer(pairHeader, PHYSX.PxContactPairHeader)
      const handle0 = this.physics.handles.get(pairHeader.get_actors(0)?.ptr)
      const handle1 = this.physics.handles.get(pairHeader.get_actors(1)?.ptr)
      if (!handle0 || !handle1) return
      for (let i = 0; i < count; i++) {
        const pair = PHYSX.NativeArrayHelpers.prototype.getContactPairAt(pairs, i)
        if (pair.events.isSet(PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_FOUND)) {
          const contactCallback = this.getContactCallback().init(true)
          this.contactCallbacks.push(contactCallback)
          const pxContactPoints = pair.extractContacts(contactPoints.begin(), 64)
          if (pxContactPoints > 0) {
            for (let j = 0; j < pxContactPoints; j++) {
              const contact = contactPoints.get(j)
              contactCallback.addContact(contact.position, contact.normal, contact.impulse)
            }
          }
          if (!handle0.contactedHandles.has(handle1)) {
            if (handle0.onContactStart) {
              contactCallback.fn0 = handle0.onContactStart
              contactCallback.event0.tag = handle1.tag
              contactCallback.event0.playerId = handle1.playerId
            }
            handle0.contactedHandles.add(handle1)
          }
          if (!handle1.contactedHandles.has(handle0)) {
            if (handle1.onContactStart) {
              contactCallback.fn1 = handle1.onContactStart
              contactCallback.event1.tag = handle0.tag
              contactCallback.event1.playerId = handle0.playerId
            }
            handle1.contactedHandles.add(handle0)
          }
        } else if (pair.events.isSet(PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_LOST)) {
          const contactCallback = this.getContactCallback().init(false)
          this.contactCallbacks.push(contactCallback)
          if (handle0.contactedHandles.has(handle1)) {
            if (handle0.onContactEnd) {
              contactCallback.fn0 = handle0.onContactEnd
              contactCallback.event0.tag = handle1.tag
              contactCallback.event0.playerId = handle1.playerId
            }
            handle0.contactedHandles.delete(handle1)
          }
          if (handle1.contactedHandles.has(handle0)) {
            if (handle1.onContactEnd) {
              contactCallback.fn1 = handle1.onContactEnd
              contactCallback.event1.tag = handle0.tag
              contactCallback.event1.playerId = handle0.playerId
            }
            handle1.contactedHandles.delete(handle0)
          }
        }
      }
    }

    simulationEventCallback.onTrigger = (pairs, count) => {
      pairs = PHYSX.wrapPointer(pairs, PHYSX.PxTriggerPair)
      for (let i = 0; i < count; i++) {
        const pair = PHYSX.NativeArrayHelpers.prototype.getTriggerPairAt(pairs, i)
        if (
          pair.flags.isSet(PHYSX.PxTriggerPairFlagEnum.eREMOVED_SHAPE_TRIGGER) ||
          pair.flags.isSet(PHYSX.PxTriggerPairFlagEnum.eREMOVED_SHAPE_OTHER)
        ) {
          continue
        }
        const triggerHandle = this.physics.handles.get(pair.triggerShape.getActor().ptr)
        const otherHandle = this.physics.handles.get(pair.otherShape.getActor().ptr)
        if (!triggerHandle || !otherHandle) continue
        if (pair.status === PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_FOUND) {
          if (!otherHandle.triggeredHandles.has(triggerHandle)) {
            if (triggerHandle.onTriggerEnter) {
              const cb = this.getTriggerCallback()
              cb.fn = triggerHandle.onTriggerEnter
              cb.event.tag = otherHandle.tag
              cb.event.playerId = otherHandle.playerId
              this.triggerCallbacks.push(cb)
            }
            otherHandle.triggeredHandles.add(triggerHandle)
          }
        } else if (pair.status === PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_LOST) {
          if (otherHandle.triggeredHandles.has(triggerHandle)) {
            if (triggerHandle.onTriggerLeave) {
              const cb = this.getTriggerCallback()
              cb.fn = triggerHandle.onTriggerLeave
              cb.event.tag = otherHandle.tag
              cb.event.playerId = otherHandle.playerId
              this.triggerCallbacks.push(cb)
            }
            otherHandle.triggeredHandles.delete(triggerHandle)
          }
        }
      }
    }

    simulationEventCallback.onConstraintBreak = (...args) => {
      console.error('TODO: onContraintBreak', ...args)
    }

    return simulationEventCallback
  }
}
