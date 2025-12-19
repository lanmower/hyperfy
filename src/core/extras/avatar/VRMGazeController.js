import * as THREE from '../three.js'
import { AimAxis, UpAxis } from './VRMFactoryConfig.js'

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const q1 = new THREE.Quaternion()

export class VRMGazeController {
  constructor(skeleton, glbVrm, vrmMatrix) {
    this.skeleton = skeleton
    this.glbVrm = glbVrm
    this.vrmMatrix = vrmMatrix
    this.smoothedRotations = new Map()
    this.bonesByName = {}
  }

  findBone(name) {
    if (!this.bonesByName[name]) {
      const actualName = this.glbVrm.humanoid.getRawBoneNode(name)?.name
      this.bonesByName[name] = this.skeleton.getBoneByName(actualName)
    }
    return this.bonesByName[name]
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
    const parentBone = this.glbVrm.humanoid.humanBones[boneName].node.parent
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
    const normalizedDir = new THREE.Vector3().copy(targetDir).normalize()
    const parentWorldMatrix = new THREE.Matrix4()
    const parentWorldRotationInverse = new THREE.Quaternion()
    parentWorldMatrix.multiplyMatrices(this.vrmMatrix, parentBone.matrixWorld)
    parentWorldMatrix.decompose(v1, parentWorldRotationInverse, v2)
    parentWorldRotationInverse.invert()
    const localDir = new THREE.Vector3().copy(normalizedDir).applyQuaternion(parentWorldRotationInverse)
    if (maintainOffset && !bone.userData.initialRotationOffset) {
      bone.userData.initialRotationOffset = bone.quaternion.clone()
    }
    const currentAimDir = new THREE.Vector3().copy(aimAxis)
    if (maintainOffset && bone.userData.initialRotationOffset) {
      currentAimDir.applyQuaternion(bone.userData.initialRotationOffset)
    }
    const rot = new THREE.Quaternion().setFromUnitVectors(aimAxis, localDir)
    const worldUp = new THREE.Vector3().copy(upAxis)
    const localUp = new THREE.Vector3().copy(worldUp).applyQuaternion(parentWorldRotationInverse)
    const rotatedUp = new THREE.Vector3().copy(upAxis).applyQuaternion(rot)
    const projectedUp = new THREE.Vector3().copy(localUp)
    projectedUp.sub(v1.copy(localDir).multiplyScalar(localDir.dot(localUp)))
    projectedUp.normalize()
    if (projectedUp.lengthSq() > 0.001) {
      const angle = rotatedUp.angleTo(projectedUp)
      const cross = new THREE.Vector3().crossVectors(rotatedUp, projectedUp)
      const upCorrection = new THREE.Quaternion()
      if (cross.dot(localDir) < 0) {
        upCorrection.setFromAxisAngle(localDir, -angle)
      } else {
        upCorrection.setFromAxisAngle(localDir, angle)
      }
      rot.premultiply(upCorrection)
    }
    const targetRotation = new THREE.Quaternion().copy(rot)
    if (maintainOffset && bone.userData.initialRotationOffset) {
      targetRotation.multiply(bone.userData.initialRotationOffset)
    }
    if (minAngle > -180 || maxAngle < 180) {
      if (!bone.userData.restRotation) {
        bone.userData.restRotation = bone.quaternion.clone()
      }
      const restToTarget = new THREE.Quaternion().copy(bone.userData.restRotation).invert().multiply(targetRotation)
      const w = restToTarget.w
      const angle = 2 * Math.acos(Math.min(Math.max(w, -1), 1))
      const angleDeg = THREE.MathUtils.radToDeg(angle)
      if (angleDeg > maxAngle || angleDeg < minAngle) {
        const clampedAngleDeg = THREE.MathUtils.clamp(angleDeg, minAngle, maxAngle)
        const clampedAngleRad = THREE.MathUtils.degToRad(clampedAngleDeg)
        const scale = clampedAngleRad / angle
        q1.copy(targetRotation)
        targetRotation.slerpQuaternions(bone.userData.restRotation, q1, scale)
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

  aimBoneAt(boneName, targetPos, getBoneTransform, delta, options = {}) {
    const bone = this.findBone(boneName)
    if (!bone) return console.warn(`aimBone: missing bone (${boneName})`)
    const boneWorldMatrix = getBoneTransform(boneName)
    const boneWorldPos = v1.setFromMatrixPosition(boneWorldMatrix)
    const aimBoneDir = new THREE.Vector3().subVectors(targetPos, boneWorldPos).normalize()
    this.aimBone(boneName, aimBoneDir, delta, options)
  }
}
