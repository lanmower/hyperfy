import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('PhysicsSimulationEvents')

export class PhysicsSimulationEvents {
  constructor(physics) {
    this.physics = physics
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
          const cb = this.physics.getContactCallback().init(true)
          this.physics.contactCallbacks.push(cb)
          const pxContactPoints = pair.extractContacts(contactPoints.begin(), 64)
          if (pxContactPoints > 0) {
            for (let j = 0; j < pxContactPoints; j++) {
              const contact = contactPoints.get(j)
              cb.addContact(contact.position, contact.normal, contact.impulse)
            }
          }
          if (!handle0.contactedHandles.has(handle1)) {
            if (handle0.onContactStart) {
              cb.fn0 = handle0.onContactStart
              cb.event0.tag = handle1.tag
              cb.event0.playerId = handle1.playerId
            }
            handle0.contactedHandles.add(handle1)
          }
          if (!handle1.contactedHandles.has(handle0)) {
            if (handle1.onContactStart) {
              cb.fn1 = handle1.onContactStart
              cb.event1.tag = handle0.tag
              cb.event1.playerId = handle0.playerId
            }
            handle1.contactedHandles.add(handle0)
          }
        } else if (pair.events.isSet(PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_LOST)) {
          const cb = this.physics.getContactCallback().init(false)
          this.physics.contactCallbacks.push(cb)
          if (handle0.contactedHandles.has(handle1)) {
            if (handle0.onContactEnd) {
              cb.fn0 = handle0.onContactEnd
              cb.event0.tag = handle1.tag
              cb.event0.playerId = handle1.playerId
            }
            handle0.contactedHandles.delete(handle1)
          }
          if (handle1.contactedHandles.has(handle0)) {
            if (handle1.onContactEnd) {
              cb.fn1 = handle1.onContactEnd
              cb.event1.tag = handle0.tag
              cb.event1.playerId = handle0.playerId
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
              const cb = this.physics.getTriggerCallback()
              cb.fn = triggerHandle.onTriggerEnter
              cb.event.tag = otherHandle.tag
              cb.event.playerId = otherHandle.playerId
              this.physics.triggerCallbacks.push(cb)
            }
            otherHandle.triggeredHandles.add(triggerHandle)
          }
        } else if (pair.status === PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_LOST) {
          if (otherHandle.triggeredHandles.has(triggerHandle)) {
            if (triggerHandle.onTriggerLeave) {
              const cb = this.physics.getTriggerCallback()
              cb.fn = triggerHandle.onTriggerLeave
              cb.event.tag = otherHandle.tag
              cb.event.playerId = otherHandle.playerId
              this.physics.triggerCallbacks.push(cb)
            }
            otherHandle.triggeredHandles.delete(triggerHandle)
          }
        }
      }
    }

    simulationEventCallback.onConstraintBreak = (...args) => {
      logger.warn('Constraint break event not yet implemented', {})
    }

    return simulationEventCallback
  }
}
