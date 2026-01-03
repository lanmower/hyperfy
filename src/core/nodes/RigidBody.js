import * as THREE from '../extras/three.js'

import { Node } from './Node.js'
import { initializeNode } from './base/NodeConstructorHelper.js'
import { createSchemaProxy } from '../utils/helpers/NodeSchemaHelper.js'
import { schema } from '../utils/validation/index.js'
import { StateInitializer } from './base/StateInitializer.js'
import { PhysicsSubsystemFactory } from './base/PhysicsSubsystemFactory.js'
import { LifecycleHelper } from './base/LifecycleHelper.js'
import { RigidBodyPhysicsIntegration } from './RigidBodyPhysics.js'

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
    this.physics = new RigidBodyPhysicsIntegration(this)
  }

  mount() {
    LifecycleHelper.markMounted(this)
    if (this.ctx.entity?.moving) return
    this.physics.createActor()
    this.physics.registerActor()
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

  unmount() {
    if (this.actor) {
      this.physics.destroy()
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
