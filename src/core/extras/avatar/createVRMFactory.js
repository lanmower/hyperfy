import { getTrianglesFromGeometry } from '../getTrianglesFromGeometry.js'
import { getTextureBytesFromMaterial } from '../getTextureBytesFromMaterial.js'
import { preprocessVRMScene, setupSkinnedMeshes } from './VRMSceneProcessor.js'
import { extractBoneGeometry, setupArmAngles } from './VRMBoneGeometry.js'
import { createAvatar } from './VRMAvatarCreator.js'

export function createVRMFactory(glb, setupMaterial) {
  preprocessVRMScene(glb)
  const skinnedMeshes = setupSkinnedMeshes(glb, setupMaterial)
  const { skeleton, rootToHips, height, headToHeight, version, normBones } = extractBoneGeometry(glb, skinnedMeshes)
  setupArmAngles(glb, normBones)
  skeleton.update()

  return {
    create: (matrix, hooks, node) => createAvatar(glb, matrix, hooks, node, rootToHips, height, headToHeight, version),
    applyStats(stats) {
      glb.scene.traverse(obj => {
        if (obj.geometry && !stats.geometries.has(obj.geometry.uuid)) {
          stats.geometries.add(obj.geometry.uuid)
          stats.triangles += getTrianglesFromGeometry(obj.geometry)
        }
        if (obj.material && !stats.materials.has(obj.material.uuid)) {
          stats.materials.add(obj.material.uuid)
          stats.textureBytes += getTextureBytesFromMaterial(obj.material)
        }
      })
    },
  }
}
