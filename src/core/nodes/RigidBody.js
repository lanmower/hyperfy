import * as THREE from '../extras/three.js'

import { Node } from './Node.js'
import { v, q, m } from '../utils/TempVectors.js'
import { defineProps, createPropertyProxy } from '../utils/helpers/defineProperty.js'
import { schema } from '../utils/validation/createNodeSchema.js'
import { RigidBodySetup } from './physics/RigidBodySetup.js'
import { PhysicsForces } from './physics/PhysicsForces.js'
import { PhysicsProperties } from './physics/PhysicsProperties.js'

const _defaultScale = new THREE.Vector3(1, 1, 1)

const propertySchema = schema('mass', 'damping', 'angularDamping', 'friction', 'restitution', 'tag', 'trigger', 'convex')
  .add('type', { default: 'static', onSet() { this.needsRebuild = true } })
  .add('linearDamping', { default: 0, onSet() { this.needsRebuild = true } })
  .add('onContactStart', { default: null })
  .add('onContactEnd', { default: null })
  .add('onTriggerEnter', { default: null })
  .add('onTriggerLeave', { default: null })
  .override('tag', { onSet(v) { if (typeof v === 'number') this._tag = v + '' } })
  .override('mass', { onSet() { this.needsRebuild = true } })
  .override('damping', { default: 0, onSet() { this.needsRebuild = true } })
  .override('angularDamping', { default: 0.05, onSet() { this.needsRebuild = true } })
  .build()

export class RigidBody extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'rigidbody'
    defineProps(this, propertySchema, defaults, data)

    this.shapes = new Set()

    this._tm = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)

    this.tempVec3 = new THREE.Vector3()
    this.tempQuat = new THREE.Quaternion()

    this.physicsForces = null
    this.physicsProperties = null
  }

  mount() {
    RigidBodySetup.mount(this, this.ctx)
    this.physicsForces = new PhysicsForces(this.actor)
    this.physicsProperties = new PhysicsProperties(this.actor, this.tempVec3, this.tempQuat)
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
    RigidBodySetup.unmount(this)
    this.physicsForces = null
    this.physicsProperties = null
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
    this.needsRebuild = true
    this.setDirty()
  }

  setKinematicTarget(position, quaternion) {
    if (this._type !== 'kinematic') {
      throw new Error('[rigidbody] setKinematicTarget failed (not kinematic)')
    }
    this.physicsProperties?.setKinematicTarget(position, quaternion, this._tm)
  }

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy(),
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
    return this.proxy
  }
}
