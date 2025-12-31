import * as THREE from '../extras/three.js'

import { Node } from './Node.js'
import { v, q, m } from '../utils/TempVectors.js'
import { initializeNode } from './base/NodeConstructorHelper.js'
import { createSchemaProxy } from '../utils/helpers/NodeSchemaHelper.js'
import { schema } from '../utils/validation/index.js'
import { PhysicsForces } from './physics/PhysicsForces.js'
import { PhysicsProperties } from './physics/PhysicsProperties.js'
import { StateInitializer } from './base/StateInitializer.js'
import { PhysicsSubsystemFactory } from './base/PhysicsSubsystemFactory.js'
import { LifecycleHelper } from './base/LifecycleHelper.js'

const _defaultScale = new THREE.Vector3(1, 1, 1)

const propertySchema = schema('mass', 'damping', 'angularDamping', 'friction', 'restitution', 'tag', 'trigger', 'convex')
  .add('type', { default: 'static', onSet() { this.markRebuild() } })
  .add('linearDamping', { default: 0, onSet() { this.markRebuild() } })
  .add('onContactStart', { default: null })
  .add('onContactEnd', { default: null })
  .add('onTriggerEnter', { default: null })
  .add('onTriggerLeave', { default: null })
  .override('tag', { onSet(v) { if (typeof v === 'number') this._tag = v + '' } })
  .override('mass', { onSet() { this.markRebuild() } })
  .override('damping', { default: 0, onSet() { this.markRebuild() } })
  .override('angularDamping', { default: 0.05, onSet() { this.markRebuild() } })
  .build()

const defaults = {}

export class RigidBody extends Node {
  constructor(data = {}) {
    super(data)
    initializeNode(this, 'rigidbody', propertySchema, {}, data)
    PhysicsSubsystemFactory.initializeRigidBodySubsystems(this)
  }

  mount() {
    LifecycleHelper.markMounted(this)
    if (this.ctx.entity?.moving) return

    this.matrixWorld.decompose(v[0], q[0], v[1])
    this.transform = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    v[0].toPxTransform(this.transform)
    q[0].toPxTransform(this.transform)

    if (this._type === 'static') {
      this.actor = this.ctx.world.physics.physics.createRigidStatic(this.transform)
    } else if (this._type === 'kinematic') {
      this.actor = this.ctx.world.physics.physics.createRigidDynamic(this.transform)
      this.actor.setRigidBodyFlag(PHYSX.PxRigidBodyFlagEnum.eKINEMATIC, true)
      PHYSX.PxRigidBodyExt.prototype.setMassAndUpdateInertia(this.actor, this._mass)
    } else if (this._type === 'dynamic') {
      this.actor = this.ctx.world.physics.physics.createRigidDynamic(this.transform)
      PHYSX.PxRigidBodyExt.prototype.setMassAndUpdateInertia(this.actor, this._mass)
      if (this._centerOfMass) {
        const pose = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
        this._centerOfMass.toPxTransform(pose)
        this.actor.setCMassLocalPose(pose)
      }
      this.actor.setLinearDamping(this._linearDamping)
      this.actor.setAngularDamping(this._angularDamping)
    }

    for (const shape of this.shapes) {
      this.actor.attachShape(shape)
    }

    const playerId = this.ctx.entity?.isPlayer ? this.ctx.entity.data.id : null
    this.actorHandle = this.ctx.world.physics.addActor(this.actor, {
      onInterpolate: this._type === 'kinematic' || this._type === 'dynamic' ? this.onInterpolate : null,
      node: this,
      get tag() {
        return this.node._tag
      },
      get playerId() {
        return playerId
      },
      get onContactStart() {
        return this.node._onContactStart
      },
      get onContactEnd() {
        return this.node._onContactEnd
      },
      get onTriggerEnter() {
        return this.node._onTriggerEnter
      },
      get onTriggerLeave() {
        return this.node._onTriggerLeave
      },
    })

    PhysicsSubsystemFactory.attachActor(this, this.actor)
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
      return
    }
    if (didMove) {
      this.actorHandle?.move(this.matrixWorld)
    }
  }

  onInterpolate = (position, quaternion) => {
    if (this.parent) {
      m[0].compose(position, quaternion, _defaultScale)
      m[1].copy(this.parent.matrixWorld).invert()
      m[2].multiplyMatrices(m[1], m[0])
      m[2].decompose(this.position, this.quaternion, v[0])
    } else {
      this.position.copy(position)
      this.quaternion.copy(quaternion)
    }
  }

  unmount() {
    if (this.actor) {
      this.actorHandle?.destroy()
      this.actorHandle = null
    }
    PhysicsSubsystemFactory.cleanupActor(this)
  }

  addShape(shape) {
    if (!shape) return
    this.shapes.add(shape)
    if (this.actor) {
      this.actor.attachShape(shape)
    }
  }

  removeShape(shape) {
    if (!shape) return
    this.shapes.delete(shape)
    if (this.actor) {
      this.actor.detachShape(shape)
    }
  }

  get sleeping() {
    return this.physicsProperties?.sleeping ?? false
  }

  addForce(force, mode) {
    this.physicsForces?.addForce(force, mode)
  }

  addForceAtPos(force, pos, mode) {
    this.physicsForces?.addForceAtPos(force, pos, mode)
  }

  addForceAtLocalPos(force, pos, mode) {
    this.physicsForces?.addForceAtLocalPos(force, pos, mode)
  }

  addTorque(torque, mode) {
    this.physicsForces?.addTorque(torque, mode)
  }

  getPosition(vec3) {
    return this.physicsProperties?.getPosition(vec3) ?? new THREE.Vector3()
  }

  setPosition(vec3) {
    this.physicsProperties?.setPosition(vec3)
    this.position.copy(vec3)
  }

  getQuaternion(quat) {
    return this.physicsProperties?.getQuaternion(quat) ?? new THREE.Quaternion()
  }

  setQuaternion(quat) {
    this.physicsProperties?.setQuaternion(quat)
    this.quaternion.copy(quat)
  }

  getLinearVelocity(vec3) {
    return this.physicsProperties?.getLinearVelocity(vec3) ?? new THREE.Vector3()
  }

  setLinearVelocity(vec3) {
    this.physicsProperties?.setLinearVelocity(vec3)
  }

  getAngularVelocity(vec3) {
    return this.physicsProperties?.getAngularVelocity(vec3) ?? new THREE.Vector3()
  }

  setAngularVelocity(vec3) {
    this.physicsProperties?.setAngularVelocity(vec3)
  }

  getVelocityAtPos(pos, vec3) {
    return this.physicsProperties?.getVelocityAtPos(pos, vec3) ?? new THREE.Vector3()
  }

  getLocalVelocityAtLocalPos(pos, vec3) {
    return this.physicsProperties?.getLocalVelocityAtLocalPos(pos, vec3) ?? new THREE.Vector3()
  }

  setCenterOfMass(pos) {
    if (!pos?.isVector3) throw new Error('[rigidbody] setCenterOfMass pos must be Vector3')
    this._centerOfMass = pos.clone()
    this.markRebuild()
    this.setDirty()
  }

  setKinematicTarget(position, quaternion) {
    if (this._type !== 'kinematic') {
      throw new Error('[rigidbody] setKinematicTarget failed (not kinematic)')
    }
    this.physicsProperties?.setKinematicTarget(position, quaternion, this._tm)
  }

  getProxy() {
    return createSchemaProxy(this, propertySchema,
      {
        addForce: this.addForce,
        addForceAtPos: this.addForceAtPos,
        addForceAtLocalPos: this.addForceAtLocalPos,
        addTorque: this.addTorque,
        getPosition: this.getPosition,
        setPosition: this.setPosition,
        getQuaternion: this.getQuaternion,
        setQuaternion: this.setQuaternion,
        getLinearVelocity: this.getLinearVelocity,
        setLinearVelocity: this.setLinearVelocity,
        getAngularVelocity: this.getAngularVelocity,
        setAngularVelocity: this.setAngularVelocity,
        getVelocityAtPos: this.getVelocityAtPos,
        getLocalVelocityAtLocalPos: this.getLocalVelocityAtLocalPos,
        setCenterOfMass: this.setCenterOfMass,
        setKinematicTarget: this.setKinematicTarget,
      },
      { sleeping: function() { return this.sleeping } }
    )
  }
}
