import * as THREE from '../extras/three.js'
import { q } from '../utils/TempVectors.js'
import { DEG2RAD } from '../extras/general.js'
import { isNumber } from 'lodash-es'

export function createJoint(type, physics, actor0, frame0, actor1, frame1, config) {
  const { offset0, offset1, quaternion0, quaternion1, axis, limitY, limitZ, limitMin, limitMax, limitStiffness, limitDamping } = config

  if (type === 'fixed') {
    offset0.toPxTransform(frame0)
    offset1.toPxTransform(frame1)
    quaternion0.toPxTransform(frame0)
    quaternion1.toPxTransform(frame1)
    return new PHYSX.FixedJointCreate(physics, actor0, frame0, actor1, frame1)
  }

  if (type === 'socket') {
    offset0.toPxTransform(frame0)
    offset1.toPxTransform(frame1)
    const alignRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), axis)
    q[0].copy(quaternion0).multiply(alignRotation).toPxTransform(frame0)
    q[1].copy(quaternion1).multiply(alignRotation).toPxTransform(frame1)
    const joint = new PHYSX.SphericalJointCreate(physics, actor0, frame0, actor1, frame1)
    if (isNumber(limitY) && isNumber(limitZ)) {
      let spring
      if (isNumber(limitStiffness) && isNumber(limitDamping)) {
        spring = new PHYSX.PxSpring(limitStiffness, limitDamping)
      }
      const cone = new PHYSX.PxJointLimitCone(limitY * DEG2RAD, limitZ * DEG2RAD, spring)
      joint.setLimitCone(cone)
      joint.setSphericalJointFlag(PHYSX.PxSphericalJointFlagEnum.eLIMIT_ENABLED, true)
      PHYSX.destroy(cone)
      if (spring) PHYSX.destroy(spring)
    }
    return joint
  }

  if (type === 'hinge') {
    offset0.toPxTransform(frame0)
    offset1.toPxTransform(frame1)
    const alignRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), axis)
    q[0].copy(quaternion0).multiply(alignRotation).toPxTransform(frame0)
    q[1].copy(quaternion1).multiply(alignRotation).toPxTransform(frame1)
    const joint = new PHYSX.RevoluteJointCreate(physics, actor0, frame0, actor1, frame1)
    if (isNumber(limitMin) && isNumber(limitMax)) {
      let spring
      if (isNumber(limitStiffness) && isNumber(limitDamping)) {
        spring = new PHYSX.PxSpring(limitStiffness, limitDamping)
      }
      const limit = new PHYSX.PxJointAngularLimitPair(limitMin * DEG2RAD, limitMax * DEG2RAD, spring)
      joint.setLimit(limit)
      joint.setRevoluteJointFlag(PHYSX.PxRevoluteJointFlagEnum.eLIMIT_ENABLED, true)
      PHYSX.destroy(limit)
      if (spring) PHYSX.destroy(spring)
    }
    return joint
  }

  if (type === 'distance') {
    offset0.toPxTransform(frame0)
    offset1.toPxTransform(frame1)
    const joint = new PHYSX.DistanceJointCreate(physics, actor0, frame0, actor1, frame1)
    joint.setMinDistance(limitMin)
    joint.setMaxDistance(limitMax)
    joint.setDistanceJointFlag(PHYSX.PxDistanceJointFlagEnum.eMIN_DISTANCE_ENABLED, true)
    joint.setDistanceJointFlag(PHYSX.PxDistanceJointFlagEnum.eMAX_DISTANCE_ENABLED, true)
    if (isNumber(limitStiffness) && isNumber(limitDamping)) {
      joint.setStiffness(limitStiffness)
      joint.setDamping(limitDamping)
      joint.setDistanceJointFlag(PHYSX.PxDistanceJointFlagEnum.eSPRING_ENABLED, true)
    }
    return joint
  }
}
