// VRM bone geometry extraction - THREE.js implementation
import * as THREE from '../three.js'
import { DEG2RAD } from '../general.js'

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()

export function extractBoneGeometry(glb, skinnedMeshes) {
  const humanoid = glb.userData.vrm.humanoid
  const hipsNode = humanoid.getRawBoneNode('hips')
  hipsNode.getWorldPosition(v1)
  const hipsPosition = v1
  const rootPosition = v2.set(0, 0, 0)
  const rootToHips = hipsPosition.y - rootPosition.y
  const version = glb.userData.vrm.meta?.metaVersion

  let height = 0.5
  for (const mesh of skinnedMeshes) {
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    const box = mesh.geometry.boundingBox
    if (box && height < box.max.y) {
      height = box.max.y
    }
  }

  const headNode = humanoid.getNormalizedBoneNode('head')
  headNode.getWorldPosition(v2)
  const headToHeight = height - v2.y

  return {
    skeleton: skinnedMeshes[0]?.skeleton,
    rootToHips,
    height,
    headToHeight,
    version,
    humanoid,
  }
}

export function setupArmAngles(glb, humanoid) {
  const leftArm = humanoid.getNormalizedBoneNode('leftUpperArm')
  if (leftArm) leftArm.rotation.z = 75 * DEG2RAD
  const rightArm = humanoid.getNormalizedBoneNode('rightUpperArm')
  if (rightArm) rightArm.rotation.z = -75 * DEG2RAD
  glb.userData.vrm.humanoid.update(0)
}
