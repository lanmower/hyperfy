import * as pc from '../playcanvas.js'
import { AimAxis, UpAxis } from './VRMFactoryConfig.js'
import { StructuredLogger } from '../../utils/logging/index.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'

const logger = new StructuredLogger('VRMControllerIK')
const { v1, v2, q1 } = SharedVectorPool('VRMControllerIK', 2, 1)

export function createAimSystem(vrmSceneOrMatrix, glbVrm, skeleton) {
  const smoothedRotations = new Map()
  const bonesByName = {}

  const findBone = name => {
    if (!bonesByName[name]) {
      const actualName = glbVrm.humanoid.getRawBoneNode(name)?.name
      bonesByName[name] = skeleton.getBoneByName(actualName)
    }
    return bonesByName[name]
  }

  const setFromUnitVectors = (from, to) => {
    const q = new pc.Quat()
    const r = from.dot(to) + 1
    if (r < 0.0001) {
      const axis = new pc.Vec3()
      if (Math.abs(from.x) > Math.abs(from.z)) {
        axis.set(-from.y, from.x, 0)
      } else {
        axis.set(0, -from.z, from.y)
      }
      axis.normalize()
      q.setFromAxisAngle(axis, Math.PI)
    } else {
      const cross = new pc.Vec3().cross(from, to)
      q.x = cross.x
      q.y = cross.y
      q.z = cross.z
      q.w = r
      q.normalize()
    }
    return q
  }

  const aimBone = (boneName, targetDir, delta, options = {}) => {
    const {
      aimAxis = AimAxis.NEG_Z,
      upAxis = UpAxis.Y,
      smoothing = 0.7,
      weight = 1.0,
      maintainOffset = false,
      minAngle = -180,
      maxAngle = 180,
    } = options
    const bone = findBone(boneName)
    const parentBone = glbVrm.humanoid.humanBones[boneName].node.parent
    if (!bone) return logger.warn('Missing bone for aim target', { boneName })
    if (!parentBone) return logger.warn('No parent bone for aim target', { boneName })
    const boneId = bone.uuid
    if (!smoothedRotations.has(boneId)) {
      smoothedRotations.set(boneId, {
        current: bone.localRotation.clone(),
        target: new pc.Quat(),
      })
    }
    const smoothState = smoothedRotations.get(boneId)
    const normalizedDir = new pc.Vec3().copy(targetDir).normalize()
    const parentWorldMat = new pc.Mat4()
    parentWorldMat.mul2(vrmSceneOrMatrix, parentBone.getWorldTransform())
    const parentWorldRotInv = new pc.Quat()
    parentWorldMat.getRotation(parentWorldRotInv)
    parentWorldRotInv.invert()
    const localDir = new pc.Vec3().copy(normalizedDir)
    parentWorldRotInv.transformVector(localDir, localDir)
    if (maintainOffset && !bone.userData.initialRotationOffset) {
      bone.userData.initialRotationOffset = bone.localRotation.clone()
    }
    const rot = setFromUnitVectors(aimAxis, localDir)
    const worldUp = new pc.Vec3().copy(upAxis)
    const localUp = new pc.Vec3().copy(worldUp)
    parentWorldRotInv.transformVector(localUp, localUp)
    const rotatedUp = new pc.Vec3().copy(upAxis)
    rot.transformVector(rotatedUp, rotatedUp)
    const projectedUp = new pc.Vec3().copy(localUp)
    const dot = localDir.dot(localUp)
    v1.copy(localDir).scale(dot)
    projectedUp.sub(v1)
    const projLen = projectedUp.length()
    if (projLen > 0.001) {
      projectedUp.normalize()
      const angle = Math.acos(pc.math.clamp(rotatedUp.dot(projectedUp), -1, 1))
      const cross = new pc.Vec3().cross(rotatedUp, projectedUp)
      if (cross.dot(localDir) < 0) {
        rot.mul(new pc.Quat().setFromAxisAngle(localDir, -angle))
      } else {
        rot.mul(new pc.Quat().setFromAxisAngle(localDir, angle))
      }
    }
    const targetRotation = new pc.Quat().copy(rot)
    if (maintainOffset && bone.userData.initialRotationOffset) {
      targetRotation.mul(bone.userData.initialRotationOffset)
    }
    if (minAngle > -180 || maxAngle < 180) {
      if (!bone.userData.restRotation) {
        bone.userData.restRotation = bone.localRotation.clone()
      }
      const restToTarget = new pc.Quat().copy(bone.userData.restRotation)
      restToTarget.invert()
      restToTarget.mul(targetRotation)
      const w = pc.math.clamp(restToTarget.w, -1, 1)
      const angle = 2 * Math.acos(w)
      const angleDeg = pc.math.radToDeg(angle)
      if (angleDeg > maxAngle || angleDeg < minAngle) {
        const clampedAngleDeg = pc.math.clamp(angleDeg, minAngle, maxAngle)
        const clampedAngleRad = pc.math.degToRad(clampedAngleDeg)
        const scale = angle !== 0 ? clampedAngleRad / angle : 0
        q1.slerp(bone.userData.restRotation, targetRotation, scale)
        targetRotation.copy(q1)
      }
    }
    if (weight < 1.0) {
      targetRotation.slerp(bone.localRotation, 1.0 - weight)
    }
    smoothState.target.copy(targetRotation)
    smoothState.current.slerp(smoothState.target, smoothing)
    bone.localRotation.copy(smoothState.current)
  }

  const aimBoneAt = (boneName, targetPos, getBoneTransform, delta, options = {}) => {
    const bone = findBone(boneName)
    if (!bone) return logger.warn('Missing bone for aim-at target', { boneName })
    const boneWorldMat = getBoneTransform(boneName)
    const boneWorldPos = v1.setFromMatrixPosition(boneWorldMat)
    const aimBoneDir = new pc.Vec3().sub2(targetPos, boneWorldPos).normalize()
    aimBone(boneName, aimBoneDir, delta, options)
  }

  return { aimBone, aimBoneAt, findBone }
}
