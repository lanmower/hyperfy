import * as THREE from '../../extras/three.js'

export class PhysicsActorManager {
  constructor(physics) {
    this.physics = physics
  }

  addActor(actor, handle) {
    handle.actor = actor
    handle.contactedHandles = new Set()
    handle.triggeredHandles = new Set()
    if (handle.onInterpolate) {
      handle.interpolation = {
        prev: {
          position: new THREE.Vector3(),
          quaternion: new THREE.Quaternion(),
        },
        next: {
          position: new THREE.Vector3(),
          quaternion: new THREE.Quaternion(),
        },
        curr: {
          position: new THREE.Vector3(),
          quaternion: new THREE.Quaternion(),
        },
      }
      const pose = actor.getGlobalPose()
      handle.interpolation.prev.position.copy(pose.p)
      handle.interpolation.prev.quaternion.copy(pose.q)
      handle.interpolation.next.position.copy(pose.p)
      handle.interpolation.next.quaternion.copy(pose.q)
      handle.interpolation.curr.position.copy(pose.p)
      handle.interpolation.curr.quaternion.copy(pose.q)
    }
    this.physics.handles.set(actor.ptr, handle)
    if (!handle.controller) {
      this.physics.scene.addActor(actor)
    }
    return {
      move: matrix => {
        if (this.physics.ignoreSetGlobalPose) {
          const isDynamic = !actor.getRigidBodyFlags?.().isSet(PHYSX.PxRigidBodyFlagEnum.eKINEMATIC)
          if (isDynamic) return
          return
        }
        matrix.toPxTransform(this.physics.transform)
        actor.setGlobalPose(this.physics.transform)
      },
      snap: pose => {
        actor.setGlobalPose(pose)
        handle.interpolation.prev.position.copy(pose.p)
        handle.interpolation.prev.quaternion.copy(pose.q)
        handle.interpolation.next.position.copy(pose.p)
        handle.interpolation.next.quaternion.copy(pose.q)
        handle.interpolation.curr.position.copy(pose.p)
        handle.interpolation.curr.quaternion.copy(pose.q)
        handle.interpolation.skip = true
      },
      destroy: () => {
        if (handle.contactedHandles.size) {
          const cb = this.physics.getContactCallback().init(false)
          for (const otherHandle of handle.contactedHandles) {
            if (otherHandle.onContactEnd) {
              cb.fn0 = otherHandle.onContactEnd
              cb.event0.tag = handle.tag
              cb.event0.playerId = handle.playerId
              cb.exec()
            }
            otherHandle.contactedHandles.delete(handle)
          }
        }
        if (handle.triggeredHandles.size) {
          const cb = this.physics.getTriggerCallback()
          for (const triggerHandle of handle.triggeredHandles) {
            if (triggerHandle.onTriggerLeave) {
              cb.fn = triggerHandle.onTriggerLeave
              cb.event.tag = handle.tag
              cb.event.playerId = handle.playerId
              cb.exec()
            }
          }
        }
        if (!handle.controller) {
          this.physics.scene.removeActor(actor)
        }
        this.physics.handles.delete(actor.ptr)
      },
    }
  }
}
