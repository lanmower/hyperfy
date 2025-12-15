import * as THREE from '../extras/three.js'
import { isBoolean, isNumber } from 'lodash-es'

import { Node } from './Node.js'
import { Layers } from '../extras/Layers.js'
import { bindRotations } from '../extras/bindRotations.js'
import { DEG2RAD, RAD2DEG } from '../extras/general.js'
import { defineProps, validators } from '../utils/defineProperty.js'
import { q } from '../utils/TempVectors.js'

const defaults = {
  type: 'fixed',
  body0: null,
  body1: null,
  breakForce: Infinity,
  breakTorque: Infinity,
  limitY: null,
  limitZ: null,
  limitMin: null,
  limitMax: null,
  limitStiffness: null,
  limitDamping: null,
  collide: false,
}

const types = ['fixed', 'socket', 'hinge', 'distance']

const rebuild = function() { this.needsRebuild = true; this.setDirty() }
const numberOrNull = (value) => (value === null || typeof value === 'number') ? null : 'must be number or null'

const propertySchema = {
  type: { default: defaults.type, validate: validators.enum(types), onSet: rebuild },
  breakForce: { default: defaults.breakForce, validate: validators.number, onSet: rebuild },
  breakTorque: { default: defaults.breakTorque, validate: validators.number, onSet: rebuild },
  limitY: { default: defaults.limitY, validate: numberOrNull, onSet: rebuild },
  limitZ: { default: defaults.limitZ, validate: numberOrNull, onSet: rebuild },
  limitMin: { default: defaults.limitMin, validate: numberOrNull, onSet: rebuild },
  limitMax: { default: defaults.limitMax, validate: numberOrNull, onSet: rebuild },
  limitStiffness: { default: defaults.limitStiffness, validate: numberOrNull, onSet: rebuild },
  limitDamping: { default: defaults.limitDamping, validate: numberOrNull, onSet: rebuild },
  collide: { default: defaults.collide, validate: validators.boolean, onSet: rebuild },
}

export class Joint extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'joint'

    this.body0 = null
    this.offset0 = new THREE.Vector3(0, 0, 0)
    this.quaternion0 = new THREE.Quaternion(0, 0, 0, 1)
    this.rotation0 = new THREE.Euler(0, 0, 0, 'YXZ')
    bindRotations(this.quaternion0, this.rotation0)
    this.body1 = null
    this.offset1 = new THREE.Vector3(0, 0, 0)
    this.quaternion1 = new THREE.Quaternion(0, 0, 0, 1)
    this.rotation1 = new THREE.Euler(0, 0, 0, 'YXZ')
    bindRotations(this.quaternion1, this.rotation1)
    this.axis = new THREE.Vector3(0, 1, 0)

    defineProps(this, propertySchema, defaults)

    this.type = data.type
    this.breakForce = data.breakForce
    this.breakTorque = data.breakTorque
    this.limitY = data.limitY
    this.limitZ = data.limitZ
    this.limitMin = data.limitMin
    this.limitMax = data.limitMax
    this.limitStiffness = data.limitStiffness
    this.limitDamping = data.limitDamping
    this.collide = data.collide

    this.frame0 = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    this.frame1 = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
  }

  mount() {
    const actor0 = this.body0?.actor
    const actor1 = this.body1?.actor
    if (!actor0 && !actor1) return // at least one required
    const frame0 = this.frame0
    const frame1 = this.frame1

    if (this.type === 'fixed') {
      // add offsets to transform
      this.offset0.toPxTransform(frame0)
      this.offset1.toPxTransform(frame1)
      // add orientations to transform (note: dont think fixed joints even need these)
      this.quaternion0.toPxTransform(frame0)
      this.quaternion1.toPxTransform(frame1)
      // make joint
      this.joint = new PHYSX.FixedJointCreate(this.ctx.world.physics.physics, actor0, frame0, actor1, frame1)
    }

    if (this.type === 'socket') {
      // add offsets to transform
      this.offset0.toPxTransform(frame0)
      this.offset1.toPxTransform(frame1)
      // create rotation to align X-axis with desired axis and apply (this relates to the limit angles)
      const alignRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), this.axis)
      q[0].copy(this.quaternion0).multiply(alignRotation).toPxTransform(frame0)
      q[1].copy(this.quaternion1).multiply(alignRotation).toPxTransform(frame1)
      // make joint
      this.joint = new PHYSX.SphericalJointCreate(this.ctx.world.physics.physics, actor0, frame0, actor1, frame1)
      // apply cone limit
      if (isNumber(this.limitY) && isNumber(this.limitZ)) {
        let spring
        if (isNumber(this.limitStiffness) && isNumber(this.limitDamping)) {
          spring = new PHYSX.PxSpring(this.limitStiffness, this.limitDamping)
        }
        const cone = new PHYSX.PxJointLimitCone(this.limitY * DEG2RAD, this.limitZ * DEG2RAD, spring)
        this.joint.setLimitCone(cone)
        this.joint.setSphericalJointFlag(PHYSX.PxSphericalJointFlagEnum.eLIMIT_ENABLED, true)
        PHYSX.destroy(cone)
        if (spring) PHYSX.destroy(spring)
      }
    }

    if (this.type === 'hinge') {
      // add offsets to transform
      this.offset0.toPxTransform(frame0)
      this.offset1.toPxTransform(frame1)
      // create rotation to align X-axis with desired axis and apply
      const alignRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), this.axis)
      q[0].copy(this.quaternion0).multiply(alignRotation).toPxTransform(frame0)
      q[1].copy(this.quaternion1).multiply(alignRotation).toPxTransform(frame1)
      // make joint
      this.joint = new PHYSX.RevoluteJointCreate(this.ctx.world.physics.physics, actor0, frame0, actor1, frame1)
      // apply limits
      if (isNumber(this.limitMin) && isNumber(this.limitMax)) {
        let spring
        if (isNumber(this.limitStiffness) && isNumber(this.limitDamping)) {
          spring = new PHYSX.PxSpring(this.limitStiffness, this.limitDamping)
        }
        const limit = new PHYSX.PxJointAngularLimitPair(this.limitMin * DEG2RAD, this.limitMax * DEG2RAD, spring)
        this.joint.setLimit(limit)
        this.joint.setRevoluteJointFlag(PHYSX.PxRevoluteJointFlagEnum.eLIMIT_ENABLED, true)
        PHYSX.destroy(limit)
        if (spring) PHYSX.destroy(spring)
      }
    }

    if (this.type === 'distance') {
      // add offsets to transform
      this.offset0.toPxTransform(frame0)
      this.offset1.toPxTransform(frame1)
      // create rotation to align X-axis with desired axis and apply
      // const alignRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), this.axis)
      // _q1.copy(this.quaternion0).multiply(alignRotation).toPxTransform(frame0)
      // _q2.copy(this.quaternion1).multiply(alignRotation).toPxTransform(frame1)
      // make joint
      this.joint = new PHYSX.DistanceJointCreate(this.ctx.world.physics.physics, actor0, frame0, actor1, frame1)
      // apply limits
      this.joint.setMinDistance(this.limitMin)
      this.joint.setMaxDistance(this.limitMax)
      this.joint.setDistanceJointFlag(PHYSX.PxDistanceJointFlagEnum.eMIN_DISTANCE_ENABLED, true)
      this.joint.setDistanceJointFlag(PHYSX.PxDistanceJointFlagEnum.eMAX_DISTANCE_ENABLED, true)
      if (isNumber(this.limitStiffness) && isNumber(this.limitDamping)) {
        this.joint.setStiffness(this.limitStiffness)
        this.joint.setDamping(this.limitDamping)
        this.joint.setDistanceJointFlag(PHYSX.PxDistanceJointFlagEnum.eSPRING_ENABLED, true)
      }
    }

    if (this.collide) {
      this.joint.setConstraintFlag(PHYSX.PxConstraintFlagEnum.eCOLLISION_ENABLED, true)
    }
    this.joint.setBreakForce(this.breakForce, this.breakTorque)
    this.needsRebuild = false
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
      return
    }
    if (didMove) {
      // ...
    }
  }

  unmount() {
    this.joint?.release()
    this.joint = null
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    for (const key in propertySchema) {
      this[key] = source[key]
    }
    this.body0 = source.body0
    this.offset0.copy(source.offset0)
    this.quaternion0.copy(source.quaternion0)
    this.body1 = source.body1
    this.offset1.copy(source.offset1)
    this.quaternion1.copy(source.quaternion1)
    this.axis.copy(source.axis)
    return this
  }

  getProxy() {
    if (!this.proxy) {
      const self = this
      let proxy = {
        get type() {
          return self.type
        },
        set type(value) {
          self.type = value
        },
        get body0() {
          return self.body0?.getProxy()
        },
        set body0(value) {
          if (value) {
            self.ctx.world._allowRefs = true
            self.body0 = value?._ref
            self.ctx.world._allowRefs = false
          } else {
            self.body0 = null
          }
          self.needsRebuild = true
          self.setDirty()
        },
        get offset0() {
          return self.offset0
        },
        get quaternion0() {
          return self.quaternion0
        },
        get rotation0() {
          return self.rotation0
        },
        get body1() {
          return self.body1?.getProxy()
        },
        set body1(value) {
          if (value) {
            self.ctx.world._allowRefs = true
            self.body1 = value?._ref
            self.ctx.world._allowRefs = false
          } else {
            self.body1 = null
          }
          self.needsRebuild = true
          self.setDirty()
        },
        get offset1() {
          return self.offset1
        },
        get quaternion1() {
          return self.quaternion1
        },
        get rotation1() {
          return self.rotation1
        },
        get axis() {
          return self.axis
        },
        get breakForce() {
          return self.breakForce
        },
        set breakForce(value) {
          self.breakForce = value
        },
        get breakTorque() {
          return self.breakTorque
        },
        set breakTorque(value) {
          self.breakTorque = value
        },
        get limitY() {
          return self.limitY
        },
        set limitY(value) {
          self.limitY = value
        },
        get limitZ() {
          return self.limitZ
        },
        set limitZ(value) {
          self.limitZ = value
        },
        get limitMin() {
          return self.limitMin
        },
        set limitMin(value) {
          self.limitMin = value
        },
        get limitMax() {
          return self.limitMax
        },
        set limitMax(value) {
          self.limitMax = value
        },
        get limitStiffness() {
          return self.limitStiffness
        },
        set limitStiffness(value) {
          self.limitStiffness = value
        },
        get limitDamping() {
          return self.limitDamping
        },
        set limitDamping(value) {
          self.limitDamping = value
        },
        get collide() {
          return self.collide
        },
        set collide(value) {
          self.collide = value
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
    }
    return this.proxy
  }
}
