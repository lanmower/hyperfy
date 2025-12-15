import * as THREE from '../extras/three.js'

import { Node } from './Node.js'
import { v, q, m } from '../utils/TempVectors.js'
import { defineProps, validators, onSetRebuild, createPropertyProxy } from '../utils/defineProperty.js'
import { bodyTypes as types } from '../utils/NodeConstants.js'

const _defaultScale = new THREE.Vector3(1, 1, 1)

const defaults = {
  type: 'static',
  mass: 1,
  linearDamping: 0,
  angularDamping: 0.05,
  tag: null,
  onContactStart: null,
  onContactEnd: null,
  onTriggerEnter: null,
  onTriggerLeave: null,
}

const propertySchema = {
  type: {
    default: defaults.type,
    validate: validators.enum(types),
    onSet: onSetRebuild(),
  },
  mass: {
    default: defaults.mass,
    validate: (v) => {
      if (typeof v !== 'number') return '[rigidbody] mass not a number'
      if (v < 0) return '[rigidbody] mass cannot be less than zero'
      return null
    },
    onSet: onSetRebuild(),
  },
  linearDamping: {
    default: defaults.linearDamping,
    validate: validators.numberMin(0),
    onSet: onSetRebuild(),
  },
  angularDamping: {
    default: defaults.angularDamping,
    validate: validators.numberMin(0),
    onSet: onSetRebuild(),
  },
  tag: {
    default: defaults.tag,
    validate: validators.stringOrNumberOrNull,
    onSet(value) {
      if (typeof value === 'number') {
        this._tag = value + ''
      }
    },
  },
  onContactStart: {
    default: defaults.onContactStart,
    validate: validators.functionOrNull,
  },
  onContactEnd: {
    default: defaults.onContactEnd,
    validate: validators.functionOrNull,
  },
  onTriggerEnter: {
    default: defaults.onTriggerEnter,
    validate: validators.functionOrNull,
  },
  onTriggerLeave: {
    default: defaults.onTriggerLeave,
    validate: validators.functionOrNull,
  },
}

let forceModes
function getForceMode(mode) {
  if (!forceModes) {
    forceModes = {
      force: PHYSX.PxForceModeEnum.eFORCE,
      impulse: PHYSX.PxForceModeEnum.eIMPULSE,
      acceleration: PHYSX.PxForceModeEnum.eACCELERATION,
      velocityChange: PHYSX.PxForceModeEnum.eVELOCITY_CHANGE,
    }
  }
  return forceModes[mode] || forceModes.force
}

export class RigidBody extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'rigidbody'
    defineProps(this, propertySchema, defaults, data)

    this.shapes = new Set()

    this._tm = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)

    this.tempVec3 = new THREE.Vector3()
    this.tempQuat = new THREE.Quaternion()
  }

  mount() {
    this.needsRebuild = false
    if (this.ctx.moving) return // physics ignored when moving apps around
    this.matrixWorld.decompose(v[0], q[0], v[1])
    this.transform = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    v[0].toPxTransform(this.transform)
    q[0].toPxTransform(this.transform)
    if (this._type === 'static') {
      this.actor = this.ctx.world.physics.physics.createRigidStatic(this.transform)
    } else if (this._type === 'kinematic') {
      this.actor = this.ctx.world.physics.physics.createRigidDynamic(this.transform)
      this.actor.setRigidBodyFlag(PHYSX.PxRigidBodyFlagEnum.eKINEMATIC, true)
      // this.actor.setMass(this.mass)
      PHYSX.PxRigidBodyExt.prototype.setMassAndUpdateInertia(this.actor, this._mass)
      // this.untrack = this.ctx.world.physics.track(this.actor, this.onPhysicsMovement)
    } else if (this._type === 'dynamic') {
      this.actor = this.ctx.world.physics.physics.createRigidDynamic(this.transform)
      // this.actor.setMass(this.mass)
      PHYSX.PxRigidBodyExt.prototype.setMassAndUpdateInertia(this.actor, this._mass)
      // this.untrack = this.ctx.world.physics.track(this.actor, this.onPhysicsMovement)
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
    const self = this
    const playerId = this.ctx.entity?.isPlayer ? this.ctx.entity.data.id : null
    this.actorHandle = this.ctx.world.physics.addActor(this.actor, {
      onInterpolate: this._type === 'kinematic' || this._type === 'dynamic' ? this.onInterpolate : null,
      node: this,
      get tag() {
        return self._tag
      },
      get playerId() {
        return playerId
      },
      get onContactStart() {
        return self._onContactStart
      },
      get onContactEnd() {
        return self._onContactEnd
      },
      get onTriggerEnter() {
        return self._onTriggerEnter
      },
      get onTriggerLeave() {
        return self._onTriggerLeave
      },
    })
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
      // this.matrix.copy(m[2])
      // this.matrixWorld.copy(m[0])
    } else {
      this.position.copy(position)
      this.quaternion.copy(quaternion)
      // this.matrix.compose(this.position, this.quaternion, this.scale)
      // this.matrixWorld.copy(this.matrix)
    }
  }

  unmount() {
    if (this.actor) {
      // this.untrack?.()
      // this.untrack = null
      this.actorHandle?.destroy()
      this.actorHandle = null
      this.actor.release()
      this.actor = null
    }
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
    if (!this.actor) return false
    return this.actor.isSleeping()
  }

  addForce(force, mode) {
    if (!force?.isVector3) throw new Error('[rigidbody] addForce force must be Vector3')
    if (!force.toPxExtVec3) force = v[0].copy(force)
    mode = getForceMode(mode)
    this.actor?.addForce(force.toPxVec3(), mode, true)
  }

  addForceAtPos(force, pos, mode) {
    if (!force?.isVector3) throw new Error('[rigidbody] addForceAtPos force must be Vector3')
    if (!pos?.isVector3) throw new Error('[rigidbody] addForceAtPos force must be Vector3')
    if (!this.actor) return
    if (!this._pv1) this._pv1 = new PHYSX.PxVec3()
    if (!this._pv2) this._pv2 = new PHYSX.PxVec3()
    if (!force.toPxExtVec3) force = v[0].copy(force)
    if (!pos.toPxExtVec3) pos = v[1].copy(pos)
    mode = getForceMode(mode)
    PHYSX.PxRigidBodyExt.prototype.addForceAtPos(
      this.actor,
      force.toPxExtVec3(this._pv1),
      pos.toPxExtVec3(this._pv2),
      mode,
      true
    )
  }

  addForceAtLocalPos(force, pos, mode) {
    if (!force?.isVector3) throw new Error('[rigidbody] addForceAtLocalPos force must be Vector3')
    if (!pos?.isVector3) throw new Error('[rigidbody] addForceAtLocalPos force must be Vector3')
    if (!this.actor) return
    if (!this._pv1) this._pv1 = new PHYSX.PxVec3()
    if (!this._pv2) this._pv2 = new PHYSX.PxVec3()
    if (!force.toPxExtVec3) force = v[0].copy(force)
    if (!pos.toPxExtVec3) pos = v[1].copy(pos)
    mode = getForceMode(mode)
    PHYSX.PxRigidBodyExt.prototype.addForceAtLocalPos(
      this.actor,
      force.toPxExtVec3(this._pv1),
      pos.toPxExtVec3(this._pv2),
      mode,
      true
    )
  }

  addTorque(torque, mode) {
    if (!torque?.isVector3) throw new Error('[rigidbody] addForce torque must be Vector3')
    if (!torque.toPxVec3) torque = v[0].copy(torque)
    mode = getForceMode(mode)
    this.actor?.addTorque(torque.toPxVec3(), mode, true)
  }

  getPosition(vec3) {
    if (!vec3) vec3 = this.tempVec3
    if (!this.actor) return vec3.set(0, 0, 0)
    const pose = this.actor.getGlobalPose()
    vec3.copy(pose.p)
    return vec3
  }

  setPosition(vec3) {
    if (!this.actor) return
    const pose = this.actor.getGlobalPose()
    vec3.toPxTransform(pose)
    this.actor.setGlobalPose(pose)
    this.position.copy(vec3)
  }

  getQuaternion(quat) {
    if (!quat) quat = this.tempQuat
    if (!this.actor) return quat.set(0, 0, 0)
    const pose = this.actor.getGlobalPose()
    quat.copy(pose.q)
    return quat
  }

  setQuaternion(quat) {
    if (!this.actor) return
    const pose = this.actor.getGlobalPose()
    quat.toPxTransform(pose)
    this.actor.setGlobalPose(pose)
    this.quaternion.copy(quat)
  }

  getLinearVelocity(vec3) {
    if (!vec3) vec3 = this.tempVec3
    if (!this.actor) return vec3.set(0, 0, 0)
    return vec3.fromPxVec3(this.actor.getLinearVelocity())
  }

  setLinearVelocity(vec3) {
    this.actor?.setLinearVelocity?.(vec3.toPxVec3())
  }

  getAngularVelocity(vec3) {
    if (!vec3) vec3 = this.tempVec3
    if (!this.actor) return vec3.set(0, 0, 0)
    return vec3.fromPxVec3(this.actor.getAngularVelocity())
  }

  setAngularVelocity(vec3) {
    this.actor?.setAngularVelocity?.(vec3.toPxVec3())
  }

  getVelocityAtPos(pos, vec3) {
    if (!pos?.isVector3) throw new Error('[rigidbody] getVelocityAtPos pos must be Vector3')
    if (!this.actor) return vec3.set(0, 0, 0)
    return vec3.copy(PHYSX.PxRigidBodyExt.prototype.getVelocityAtPos(this.actor, pos.toPxVec3()))
  }

  getLocalVelocityAtLocalPos(pos, vec3) {
    if (!pos?.isVector3) throw new Error('[rigidbody] getVelocityAtLocalPos pos must be Vector3')
    if (!this.actor) return vec3.set(0, 0, 0)
    return vec3.copy(PHYSX.PxRigidBodyExt.prototype.getLocalVelocityAtLocalPos(this.actor, pos.toPxVec3()))
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
    position.toPxTransform(this._tm)
    quaternion.toPxTransform(this._tm)
    this.actor?.setKinematicTarget(this._tm)
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
