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
      const model = obj.getComponent('model')
      if (model) {
        for (let i = 0; i < model.meshInstances.length; i++) {
          model.meshInstances[i].castShadow = true
          model.meshInstances[i].receiveShadow = true
        }
      }
    }
  })
}

export function setupSkinnedMeshes(glb, setupMaterial) {
  const skinnedMeshes = []
  glb.scene.traverse(node => {
    if (node.isSkinnedMesh) {
      const skinInstance = node.skinInstance
      if (skinInstance) {
        const worldMat = node.getWorldTransform()
        const bindMat = new pc.Mat4()
        bindMat.copy(worldMat)
        skinInstance.bones[0]._parent.setLocalTransform(bindMat)
        skinnedMeshes.push(node)
      }
    }
    if (node.isMesh) {
      const model = node.getComponent('model')
      if (model) {
        for (let i = 0; i < model.meshInstances.length; i++) {
          model.meshInstances[i].receiveShadow = true
        }
      }
      setupMaterial(node.material)
    }
  })
  return skinnedMeshes
}
