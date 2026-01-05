// VRM scene preprocessing - cleanup and shadow setup
import * as pc from '../playcanvas.js'

export function preprocessVRMScene(glb) {
  const expressions = glb.scene.children.filter(n => n.type === 'VRMExpression')
  for (const node of expressions) node.removeFromParent()
  const vrmHumanoidRigs = glb.scene.children.filter(n => n.name === 'VRMHumanoidRig')
  for (const node of vrmHumanoidRigs) node.removeFromParent()
  const secondaries = glb.scene.children.filter(n => n.name === 'secondary')
  for (const node of secondaries) node.removeFromParent()
  glb.scene.traverse(obj => {
    if (obj.isMesh) {
      // THREE.js mesh - set shadow properties directly
      obj.castShadow = true
      obj.receiveShadow = true
    }
  })
}

export function setupSkinnedMeshes(glb, setupMaterial) {
  const skinnedMeshes = []
  glb.scene.traverse(node => {
    if (node.isSkinnedMesh) {
      // THREE.js skinned mesh
      skinnedMeshes.push(node)
    }
    if (node.isMesh) {
      // THREE.js mesh - set shadow and material
      node.receiveShadow = true
      if (node.material && setupMaterial) {
        setupMaterial(node.material)
      }
    }
  })
  return skinnedMeshes
}
