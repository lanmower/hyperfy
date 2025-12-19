import * as THREE from '../three.js'
import { AimAxis, UpAxis } from './VRMFactoryConfig.js'

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const normalizedDir = new THREE.Vector3()
const parentWorldMatrix = new THREE.Matrix4()
const parentWorldRotationInverse = new THREE.Quaternion()
const localDir = new THREE.Vector3()
const currentAimDir = new THREE.Vector3()
const rot = new THREE.Quaternion()
const worldUp = new THREE.Vector3()
const localUp = new THREE.Vector3()
const rotatedUp = new THREE.Vector3()
const projectedUp = new THREE.Vector3()
const upCorrection = new THREE.Quaternion()
const cross = new THREE.Vector3()
const targetRotation = new THREE.Quaternion()
const restToTarget = new THREE.Quaternion()

export class VRMAimController {
  constructor(vrmScene, glbData, findBone) {
    this.vrmScene = vrmScene
    this.glbData = glbData
    this.findBone = findBone
    this.smoothedRotations = new Map()
  }

  aimBone(boneName, targetDir, delta, options = {}) {
    const {
      aimAxis = AimAxis.NEG_Z,
      upAxis = UpAxis.Y,
      smoothing = 0.7,
      weight = 1.0,
      maintainOffset = false,
      minAngle = -180,
      maxAngle = 180,
    } = options

    const bone = this.findBone(boneName)
    const parentBone = this.glbData.userData.vrm.humanoid.humanBones[boneName].node.parent
    if (!bone) return console.warn(`aimBone: missing bone (${boneName})`)
    if (!parentBone) return console.warn(`aimBone: no parent bone`)

    const boneId = bone.uuid
    if (!this.smoothedRotations.has(boneId)) {
      this.smoothedRotations.set(boneId, {
        current: bone.quaternion.clone(),
        target: new THREE.Quaternion(),
      })
    }
    const smoothState = this.smoothedRotations.get(boneId)

    normalizedDir.copy(targetDir).normalize()
    parentWorldMatrix.multiplyMatrices(this.vrmScene.matrixWorld, parentBone.matrixWorld)
    parentWorldMatrix.decompose(v1, parentWorldRotationInverse, v2)
    parentWorldRotationInverse.invert()
    localDir.copy(normalizedDir).applyQuaternion(parentWorldRotationInverse)

    if (maintainOffset && !bone.userData.initialRotationOffset) {
      bone.userData.initialRotationOffset = bone.quaternion.clone()
    }

    currentAimDir.copy(aimAxis)
    if (maintainOffset && bone.userData.initialRotationOffset) {
      currentAimDir.applyQuaternion(bone.userData.initialRotationOffset)
    }

    rot.setFromUnitVectors(aimAxis, localDir)
    worldUp.copy(upAxis)
    localUp.copy(worldUp).applyQuaternion(parentWorldRotationInverse)
    rotatedUp.copy(upAxis).applyQuaternion(rot)
    projectedUp.copy(localUp)
    projectedUp.sub(v1.copy(localDir).multiplyScalar(localDir.dot(localUp)))
    projectedUp.normalize()

    if (projectedUp.lengthSq() > 0.001) {
      upCorrection.setFromUnitVectors(rotatedUp, projectedUp)
      const angle = rotatedUp.angleTo(projectedUp)
      cross.crossVectors(rotatedUp, projectedUp)
      if (cross.dot(localDir) < 0) {
        upCorrection.setFromAxisAngle(localDir, -angle)
      } else {
        upCorrection.setFromAxisAngle(localDir, angle)
      }
      rot.premultiply(upCorrection)
    }

    targetRotation.copy(rot)
    if (maintainOffset && bone.userData.initialRotationOffset) {
      targetRotation.multiply(bone.userData.initialRotationOffset)
    }

    if (minAngle > -180 || maxAngle < 180) {
      if (!bone.userData.restRotation) {
        bone.userData.restRotation = bone.quaternion.clone()
      }
      restToTarget.copy(bone.userData.restRotation).invert().multiply(targetRotation)
      const w = restToTarget.w
      const angle = 2 * Math.acos(Math.min(Math.max(w, -1), 1))
      const angleDeg = THREE.MathUtils.radToDeg(angle)
      if (angleDeg > maxAngle || angleDeg < minAngle) {
        const clampedAngleDeg = THREE.MathUtils.clamp(angleDeg, minAngle, maxAngle)
        const clampedAngleRad = THREE.MathUtils.degToRad(clampedAngleDeg)
        const scale = clampedAngleRad / angle
        const q = new THREE.Quaternion().copy(targetRotation)
        targetRotation.slerpQuaternions(bone.userData.restRotation, q, scale)
      }
    }

    if (weight < 1.0) {
      targetRotation.slerp(bone.quaternion, 1.0 - weight)
    }

    smoothState.target.copy(targetRotation)
    smoothState.current.slerp(smoothState.target, smoothing)
    bone.quaternion.copy(smoothState.current)
    bone.updateMatrixWorld(true)
  }

  aimBoneAt(boneName, targetPos, delta, findBone, getBoneTransform, options = {}) {
    const bone = findBone(boneName)
    if (!bone) return console.warn(`aimBone: missing bone (${boneName})`)
    const boneWorldMatrix = getBoneTransform(boneName)
    const boneWorldPos = v1.setFromMatrixPosition(boneWorldMatrix)
    const aimBoneDir = new THREE.Vector3().subVectors(targetPos, boneWorldPos).normalize()
    this.aimBone(boneName, aimBoneDir, delta, options)
  }
}
