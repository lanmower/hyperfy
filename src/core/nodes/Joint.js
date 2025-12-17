import * as THREE from '../extras/three.js'

import { Node } from './Node.js'
import { Layers } from '../extras/Layers.js'
import { bindRotations } from '../extras/bindRotations.js'
import { DEG2RAD, RAD2DEG } from '../extras/general.js'
import { defineProps, createPropertyProxy } from '../../utils/helpers/defineProperty.js'
import { schema } from '../../utils/validation/createNodeSchema.js'
import { q } from '../utils/TempVectors.js'

const rebuild = function() { this.needsRebuild = true; this.setDirty() }

const propertySchema = schema('limits', 'stiffness', 'damping', 'collide', 'breakForce', 'breakTorque')
  .add('type', { default: 'fixed', onSet: rebuild })
  .add('limitY', { default: null, onSet: rebuild })
  .add('limitZ', { default: null, onSet: rebuild })
  .add('limitMin', { default: null, onSet: rebuild })
  .add('limitMax', { default: null, onSet: rebuild })
  .add('limitStiffness', { default: null, onSet: rebuild })
  .add('limitDamping', { default: null, onSet: rebuild })
  .overrideAll({
    breakForce: { default: Infinity, onSet: rebuild },
    breakTorque: { default: Infinity, onSet: rebuild },
    collide: { default: false, onSet: rebuild },
  })
  .build()

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

    defineProps(this, propertySchema, defaults, data)

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
      this.offset0.toPxTransform(frame0)
      this.offset1.toPxTransform(frame1)
      this.quaternion0.toPxTransform(frame0)
      this.quaternion1.toPxTransform(frame1)
      this.joint = new PHYSX.FixedJointCreate(this.ctx.world.physics.physics, actor0, frame0, actor1, frame1)
    }

    if (this.type === 'socket') {
      this.offset0.toPxTransform(frame0)
      this.offset1.toPxTransform(frame1)
      const alignRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), this.axis)
      q[0].copy(this.quaternion0).multiply(alignRotation).toPxTransform(frame0)
      q[1].copy(this.quaternion1).multiply(alignRotation).toPxTransform(frame1)
      this.joint = new PHYSX.SphericalJointCreate(this.ctx.world.physics.physics, actor0, frame0, actor1, frame1)
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
      this.offset0.toPxTransform(frame0)
      this.offset1.toPxTransform(frame1)
      const alignRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), this.axis)
      q[0].copy(this.quaternion0).multiply(alignRotation).toPxTransform(frame0)
      q[1].copy(this.quaternion1).multiply(alignRotation).toPxTransform(frame1)
      this.joint = new PHYSX.RevoluteJointCreate(this.ctx.world.physics.physics, actor0, frame0, actor1, frame1)
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
      this.offset0.toPxTransform(frame0)
      this.offset1.toPxTransform(frame1)
      this.joint = new PHYSX.DistanceJointCreate(this.ctx.world.physics.physics, actor0, frame0, actor1, frame1)
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
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy(),
        {},
        {
          body0: {
            get() { return self.body0?.getProxy() },
            set(value) {
              if (value) {
                self.ctx.world._allowRefs = true
                self.body0 = value?._ref
                self.ctx.world._allowRefs = false
              } else {
                self.body0 = null
              }
              self.needsRebuild = true
              self.setDirty()
            }
          },
          offset0: function() { return self.offset0 },
          quaternion0: function() { return self.quaternion0 },
          rotation0: function() { return self.rotation0 },
          body1: {
            get() { return self.body1?.getProxy() },
            set(value) {
              if (value) {
                self.ctx.world._allowRefs = true
                self.body1 = value?._ref
                self.ctx.world._allowRefs = false
              } else {
                self.body1 = null
              }
              self.needsRebuild = true
              self.setDirty()
            }
          },
          offset1: function() { return self.offset1 },
          quaternion1: function() { return self.quaternion1 },
          rotation1: function() { return self.rotation1 },
          axis: function() { return self.axis },
        }
      )
    }
    return this.proxy
  }
}
