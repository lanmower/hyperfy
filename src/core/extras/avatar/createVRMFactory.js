import { getTrianglesFromGeometry } from '../getTrianglesFromGeometry.js'
import { getTextureBytesFromMaterial } from '../getTextureBytesFromMaterial.js'
import { preprocessVRMScene, setupSkinnedMeshes } from './VRMSceneProcessor.js'
import { extractBoneGeometry, setupArmAngles } from './VRMBoneGeometry.js'
import { createAvatar } from './VRMAvatarCreator.js'

export function createVRMFactory(glb, setupMaterial) {
  preprocessVRMScene(glb)
  const skinnedMeshes = setupSkinnedMeshes(glb, setupMaterial)
  const { skeleton, rootToHips, height, headToHeight, version, humanoid } = extractBoneGeometry(glb, skinnedMeshes)
  setupArmAngles(glb, humanoid)
  if (skeleton) skeleton.update()

  return {
    create: (matrix, hooks, node) => createAvatar(glb, matrix, hooks, node, rootToHips, height, headToHeight, version),
    applyStats(stats) {
      function traverse(entity) {
        if (entity.model && entity.model.asset && entity.model.asset.resource) {
          const mesh = entity.model.asset.resource
          if (mesh.geometry && !stats.geometries.has(mesh.geometry.uuid)) {
            stats.geometries.add(mesh.geometry.uuid)
            stats.triangles += getTrianglesFromGeometry(mesh.geometry)
          }
          if (mesh.material && !stats.materials.has(mesh.material.uuid)) {
            stats.materials.add(mesh.material.uuid)
            stats.textureBytes += getTextureBytesFromMaterial(mesh.material)
          }
        }
        for (let i = 0; i < entity.children.length; i++) {
          traverse(entity.children[i])
        }
      }
      traverse(glb.scene)
    },
  }
}
