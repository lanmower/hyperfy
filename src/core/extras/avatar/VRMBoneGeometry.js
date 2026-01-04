import * as pc from '../../playcanvas.js'
import { DEG2RAD } from '../general.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'

const { v1, v2 } = SharedVectorPool('VRMBoneGeometry', 2)

export function extractBoneGeometry(glb, skinnedMeshes) {
  const bones = glb.userData.vrm.humanoid._rawHumanBones.humanBones
  const hipsPos = bones.hips.node.getWorldTransform().getTranslation()
  v1.set(hipsPos.x, hipsPos.y, hipsPos.z)
  const hipsPosition = v1
  const rootPosition = v2.set(0, 0, 0)
  const rootToHips = hipsPosition.y - rootPosition.y
  const version = glb.userData.vrm.meta?.metaVersion

  let height = 0.5
  for (const mesh of skinnedMeshes) {
    const aabb = mesh.aabb
    if (height < aabb.max.y) {
      height = aabb.max.y
    }
  }

  const normBones = glb.userData.vrm.humanoid._normalizedHumanBones.humanBones
  const headWorldPos = normBones.head.node.getWorldTransform().getTranslation()
  const headPos = new pc.Vec3(headWorldPos.x, headWorldPos.y, headWorldPos.z)
  const headToHeight = height - headPos.y

  return {
    skeleton: skinnedMeshes[0].skeleton,
    rootToHips,
    height,
    headToHeight,
    version,
    normBones,
  }
}

export function setupArmAngles(glb, normBones) {
  const leftArm = normBones.leftUpperArm.node
  const leftRot = leftArm.getLocalRotation()
  leftRot.z = 75 * DEG2RAD
  leftArm.setLocalRotation(leftRot)
  const rightArm = normBones.rightUpperArm.node
  const rightRot = rightArm.getLocalRotation()
  rightRot.z = -75 * DEG2RAD
  rightArm.setLocalRotation(rightRot)
  glb.userData.vrm.humanoid.update(0)
}
