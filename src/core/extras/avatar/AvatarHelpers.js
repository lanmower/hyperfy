import * as THREE from '../three.js'

export class AvatarHelpers {
  static calculateDimensions(glb, skinnedMeshes, normBones) {
    const v1 = new THREE.Vector3()
    const v2 = new THREE.Vector3()

    const hipsPosition = v1.setFromMatrixPosition(glb.userData.vrm.humanoid._rawHumanBones.humanBones.hips.node.matrixWorld)
    const rootPosition = v2.set(0, 0, 0)
    const rootToHips = hipsPosition.y - rootPosition.y

    let height = 0.5
    for (const mesh of skinnedMeshes) {
      if (!mesh.boundingBox) mesh.computeBoundingBox()
      if (height < mesh.boundingBox.max.y) {
        height = mesh.boundingBox.max.y
      }
    }

    const headPos = normBones.head.node.getWorldPosition(new THREE.Vector3())
    const headToHeight = height - headPos.y

    return { height, headToHeight, rootToHips }
  }

  static getBoneName(glb, vrmBoneName) {
    return glb.userData.vrm.humanoid.getRawBoneNode(vrmBoneName)?.name
  }

  static getSkinnedMeshes(scene) {
    const skinnedMeshes = []
    scene.traverse(node => {
      if (node.isSkinnedMesh) {
        skinnedMeshes.push(node)
      }
    })
    return skinnedMeshes
  }

  static setupSkeleton(glb) {
    const skinnedMeshes = this.getSkinnedMeshes(glb.scene)
    const normBones = glb.userData.vrm.humanoid._normalizedHumanBones.humanBones

    const leftArm = normBones.leftUpperArm.node
    leftArm.rotation.z = 75 * Math.PI / 180
    const rightArm = normBones.rightUpperArm.node
    rightArm.rotation.z = -75 * Math.PI / 180
    glb.userData.vrm.humanoid.update(0)
    skinnedMeshes[0].skeleton.update()

    return skinnedMeshes[0].skeleton
  }
}
