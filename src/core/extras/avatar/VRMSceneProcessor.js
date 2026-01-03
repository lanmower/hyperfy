// VRM scene preprocessing - cleanup and shadow setup
import * as THREE from '../three.js'

export function preprocessVRMScene(glb) {
  glb.scene.matrixAutoUpdate = false
  glb.scene.matrixWorldAutoUpdate = false
  const expressions = glb.scene.children.filter(n => n.type === 'VRMExpression')
  for (const node of expressions) node.removeFromParent()
  const vrmHumanoidRigs = glb.scene.children.filter(n => n.name === 'VRMHumanoidRig')
  for (const node of vrmHumanoidRigs) node.removeFromParent()
  const secondaries = glb.scene.children.filter(n => n.name === 'secondary')
  for (const node of secondaries) node.removeFromParent()
  glb.scene.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true
      obj.receiveShadow = true
    }
  })
}

export function setupSkinnedMeshes(glb, setupMaterial) {
  const skinnedMeshes = []
  glb.scene.traverse(node => {
    if (node.isSkinnedMesh) {
      node.bindMode = THREE.DetachedBindMode
      node.bindMatrix.copy(node.matrixWorld)
      node.bindMatrixInverse.copy(node.bindMatrix).invert()
      skinnedMeshes.push(node)
    }
    if (node.isMesh) {
      if (node.geometry.computeBoundsTree) {
        node.geometry.computeBoundsTree()
      }
      node.material.shadowSide = THREE.BackSide
      setupMaterial(node.material)
    }
  })
  return skinnedMeshes
}
