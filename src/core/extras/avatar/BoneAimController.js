import * as THREE from '../three.js'

export class BoneAimController {
  constructor(glb, skeleton, bonesByName) {
    this.glb = glb
    this.skeleton = skeleton
    this.bonesByName = bonesByName
    this.gazeDir = new THREE.Vector3(0, 0, -1)
    this.maxGazeDistance = 100
    this.boneConstraints = new Map()
  }

  setGazeDirection(direction) {
    this.gazeDir.copy(direction).normalize()
  }

  setMaxGazeDistance(distance) {
    this.maxGazeDistance = distance
  }

  setBoneConstraint(boneName, minAngle, maxAngle) {
    this.boneConstraints.set(boneName, { minAngle, maxAngle })
  }

  applyHeadAim(headBone, lookAtPoint) {
    if (!headBone) return

    const targetDir = new THREE.Vector3()
    targetDir.subVectors(lookAtPoint, headBone.getWorldPosition(new THREE.Vector3()))

    const constraint = this.boneConstraints.get('head')
    if (constraint) {
      this.constrainBoneRotation(headBone, targetDir, constraint)
    } else {
      headBone.lookAt(lookAtPoint)
    }
  }

  constrainBoneRotation(bone, targetDir, constraint) {
    const currentRotation = bone.rotation.clone()
    bone.lookAt(bone.position.clone().add(targetDir))

    const newRotation = bone.rotation
    if (Math.abs(newRotation.x) > constraint.maxAngle) {
      bone.rotation.x = Math.sign(newRotation.x) * constraint.maxAngle
    }
    if (Math.abs(newRotation.y) > constraint.maxAngle) {
      bone.rotation.y = Math.sign(newRotation.y) * constraint.maxAngle
    }
  }

  update() {
    this.skeleton.update()
  }

  dispose() {
    this.boneConstraints.clear()
  }
}
