import { v, q } from '../../utils/TempVectors.js'

export class RigidBodySetup {
  static mount(rigidBody, ctx) {
    rigidBody.needsRebuild = false
    if (ctx.moving) return // physics ignored when moving apps around

    rigidBody.matrixWorld.decompose(v[0], q[0], v[1])
    rigidBody.transform = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    v[0].toPxTransform(rigidBody.transform)
    q[0].toPxTransform(rigidBody.transform)

    if (rigidBody._type === 'static') {
      rigidBody.actor = ctx.world.physics.physics.createRigidStatic(rigidBody.transform)
    } else if (rigidBody._type === 'kinematic') {
      rigidBody.actor = ctx.world.physics.physics.createRigidDynamic(rigidBody.transform)
      rigidBody.actor.setRigidBodyFlag(PHYSX.PxRigidBodyFlagEnum.eKINEMATIC, true)
      PHYSX.PxRigidBodyExt.prototype.setMassAndUpdateInertia(rigidBody.actor, rigidBody._mass)
    } else if (rigidBody._type === 'dynamic') {
      rigidBody.actor = ctx.world.physics.physics.createRigidDynamic(rigidBody.transform)
      PHYSX.PxRigidBodyExt.prototype.setMassAndUpdateInertia(rigidBody.actor, rigidBody._mass)
      if (rigidBody._centerOfMass) {
        const pose = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
        rigidBody._centerOfMass.toPxTransform(pose)
        rigidBody.actor.setCMassLocalPose(pose)
      }
      rigidBody.actor.setLinearDamping(rigidBody._linearDamping)
      rigidBody.actor.setAngularDamping(rigidBody._angularDamping)
    }

    for (const shape of rigidBody.shapes) {
      rigidBody.actor.attachShape(shape)
    }

    const playerId = rigidBody.ctx.entity?.isPlayer ? rigidBody.ctx.entity.data.id : null
    rigidBody.actorHandle = ctx.world.physics.addActor(rigidBody.actor, {
      onInterpolate: rigidBody._type === 'kinematic' || rigidBody._type === 'dynamic' ? rigidBody.onInterpolate : null,
      node: rigidBody,
      get tag() {
        return rigidBody._tag
      },
      get playerId() {
        return playerId
      },
      get onContactStart() {
        return rigidBody._onContactStart
      },
      get onContactEnd() {
        return rigidBody._onContactEnd
      },
      get onTriggerEnter() {
        return rigidBody._onTriggerEnter
      },
      get onTriggerLeave() {
        return rigidBody._onTriggerLeave
      },
    })
  }

  static unmount(rigidBody) {
    if (rigidBody.actor) {
      rigidBody.actorHandle?.destroy()
      rigidBody.actorHandle = null
      rigidBody.actor.release()
      rigidBody.actor = null
    }
  }
}
