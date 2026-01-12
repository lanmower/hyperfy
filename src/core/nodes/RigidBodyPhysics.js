import * as THREE from '../extras/three.js'
import { v, q, m } from '../utils/TempVectors.js'
import { PhysicsForces } from './physics/PhysicsForces.js'
import { PhysicsProperties } from './physics/PhysicsProperties.js'

const _defaultScale = new THREE.Vector3(1, 1, 1)

export class RigidBodyPhysicsIntegration {
  constructor(rigidbody) {
    this.rigidbody = rigidbody
  }

  createActor() {
    const rb = this.rigidbody
    rb.matrixWorld.decompose(v[0], q[0], v[1])
    rb.transform = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    v[0].toPxTransform(rb.transform)
    q[0].toPxTransform(rb.transform)

    if (rb._type === 'static') {
      rb.actor = rb.ctx.world.physics.physics.createRigidStatic(rb.transform)
    } else if (rb._type === 'kinematic') {
      rb.actor = rb.ctx.world.physics.physics.createRigidDynamic(rb.transform)
      rb.actor.setRigidBodyFlag(PHYSX.PxRigidBodyFlagEnum.eKINEMATIC, true)
      PHYSX.PxRigidBodyExt.prototype.setMassAndUpdateInertia(rb.actor, rb._mass)
    } else if (rb._type === 'dynamic') {
      rb.actor = rb.ctx.world.physics.physics.createRigidDynamic(rb.transform)
      PHYSX.PxRigidBodyExt.prototype.setMassAndUpdateInertia(rb.actor, rb._mass)
      if (rb._centerOfMass) {
        const pose = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
        rb._centerOfMass.toPxTransform(pose)
        rb.actor.setCMassLocalPose(pose)
      }
      rb.actor.setLinearDamping(rb._linearDamping)
      rb.actor.setAngularDamping(rb._angularDamping)
    }

    for (const shape of rb.shapes) {
      rb.actor.attachShape(shape)
    }
  }

  registerActor() {
    const rb = this.rigidbody
    const playerId = rb.ctx.entity?.isPlayer ? rb.ctx.entity.data.id : null
    rb.actorHandle = rb.ctx.world.physics.addActor(rb.actor, {
      onInterpolate: rb._type === 'kinematic' || rb._type === 'dynamic' ? this.onInterpolate : null,
      node: rb,
      get tag() { return this.node._tag },
      get playerId() { return playerId },
      get onContactStart() { return this.node._onContactStart },
      get onContactEnd() { return this.node._onContactEnd },
      get onTriggerEnter() { return this.node._onTriggerEnter },
      get onTriggerLeave() { return this.node._onTriggerLeave },
    })
  }

  onInterpolate = (position, quaternion) => {
    const rb = this.rigidbody
    if (rb.parent) {
      m[0].compose(position, quaternion, _defaultScale)
      m[1].copy(rb.parent.matrixWorld).invert()
      m[2].multiplyMatrices(m[1], m[0])
      m[2].decompose(rb.position, rb.quaternion, v[0])
    } else {
      rb.position.copy(position)
      rb.quaternion.copy(quaternion)
    }
  }

  destroy() {
    const rb = this.rigidbody
    if (rb.actor) {
      rb.actorHandle?.destroy()
      rb.actorHandle = null
    }
  }
}
