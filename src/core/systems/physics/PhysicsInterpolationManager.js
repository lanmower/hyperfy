export class PhysicsInterpolationManager {
  constructor(physics) {
    this.physics = physics
  }

  processActiveActors(scene, handles, active) {
    const activeActors = PHYSX.SupportFunctions.prototype.PxScene_getActiveActors(scene)
    const size = activeActors.size()
    for (let i = 0; i < size; i++) {
      const actorPtr = activeActors.get(i).ptr
      const handle = handles.get(actorPtr)
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
      active.add(handle)
    }
  }

  interpolateActive(active, alpha) {
    for (const handle of active) {
      const lerp = handle.interpolation
      if (lerp.skip) {
        lerp.skip = false
        continue
      }
      lerp.curr.position.lerpVectors(lerp.prev.position, lerp.next.position, alpha)
      lerp.curr.quaternion.slerpQuaternions(lerp.prev.quaternion, lerp.next.quaternion, alpha)
      handle.onInterpolate(lerp.curr.position, lerp.curr.quaternion)
    }
  }
}
