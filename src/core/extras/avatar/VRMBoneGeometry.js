// VRM bone geometry extraction and calculations
import * as THREE from '../three.js'
import { DEG2RAD } from '../general.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'

const { v1, v2 } = SharedVectorPool('VRMBoneGeometry', 2)

export function extractBoneGeometry(glb, skinnedMeshes) {
  const bones = glb.userData.vrm.humanoid._rawHumanBones.humanBones
  const hipsPosition = v1.setFromMatrixPosition(bones.hips.node.matrixWorld)
  const rootPosition = v2.set(0, 0, 0)
  const rootToHips = hipsPosition.y - rootPosition.y
  const version = glb.userData.vrm.meta?.metaVersion

  let height = 0.5
  for (const mesh of skinnedMeshes) {
    if (!mesh.boundingBox) mesh.computeBoundingBox()
    if (height < mesh.boundingBox.max.y) {
      height = mesh.boundingBox.max.y
    }
  }

  const normBones = glb.userData.vrm.humanoid._normalizedHumanBones.humanBones
  const headPos = normBones.head.node.getWorldPosition(new THREE.Vector3())
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
  leftArm.rotation.z = 75 * DEG2RAD
  const rightArm = normBones.rightUpperArm.node
  rightArm.rotation.z = -75 * DEG2RAD
  glb.userData.vrm.humanoid.update(0)
}
