// VRM avatar instantiation and setup
import * as pc from '../../playcanvas.js'
import { MAX_GAZE_DISTANCE } from './VRMFactoryConfig.js'
import { cloneGLB, getSkinnedMeshes, createCapsule } from './VRMUtilities.js'
import { createAnimationSystem, createAimSystem } from './VRMControllers.js'
import { Emotes } from '../playerEmotes.js'

const material = new pc.Material()

export function createAvatar(glb, matrix, hooks, node, rootToHips, height, headToHeight, version) {
  const vrm = cloneGLB(glb)
  const tvrm = vrm.userData.vrm
  const skinnedMeshes = getSkinnedMeshes(vrm.scene)
  const skeleton = skinnedMeshes[0].model.skinInstances[0].skin
  const rootBoneEntity = skeleton.bones[0]
  const rootBoneParent = rootBoneEntity.parent
  if (rootBoneParent) {
    rootBoneParent.removeChild(rootBoneEntity)
  }
  vrm.scene.setLocalMatrix(matrix)
  hooks.scene.addChild(vrm.scene)

  const getEntity = () => node?.ctx.entity

  const cRadius = 0.3
  const sItem = {
    matrix,
    geometry: createCapsule(cRadius, height - cRadius * 2),
    material,
    getEntity,
  }
  hooks.octree?.insert(sItem)

  function traverse(entity) {
    entity.getEntity = getEntity
    for (let i = 0; i < entity.children.length; i++) {
      traverse(entity.children[i])
    }
  }
  traverse(vrm.scene)

  const getBoneName = vrmBoneName => {
    return glb.userData.vrm.humanoid.getRawBoneNode(vrmBoneName)?.name
  }

  const animationSystem = createAnimationSystem(skinnedMeshes, hooks, rootToHips, version, getBoneName)
  const gazeController = createAimSystem(vrm.scene.getWorldTransform(), glb.userData.vrm, skeleton)

  setupDefaultPoses(animationSystem)

  const mt = new pc.Mat4()
  const getBoneTransform = boneName => {
    const bone = gazeController.findBone(boneName)
    if (!bone) return null
    mt.mul2(vrm.scene.getWorldTransform(), bone.getWorldTransform())
    return mt
  }

  const updateRate = () => {
    animationSystem.updateRate(vrm.scene.getLocalMatrix(), hooks.camera.getWorldTransform())
  }

  const update = delta => {
    const shouldUpdate = animationSystem.update(delta)
    if (shouldUpdate) {
      for (let i = 0; i < skeleton.bones.length; i++) {
        const bone = skeleton.bones[i]
        if (bone.updateMatrices) {
          bone.updateMatrices()
        }
      }
      const loco = animationSystem.getLocomotionState()
      const distance = animationSystem.getDistance()
      const currentEmote = animationSystem.getCurrentEmote()
      if (loco.gazeDir && distance < MAX_GAZE_DISTANCE && (currentEmote ? currentEmote.gaze : true)) {
        gazeController.aimBone('neck', loco.gazeDir, delta, {
          minAngle: -30,
          maxAngle: 30,
          smoothing: 0.4,
          weight: 0.6,
        })
        gazeController.aimBone('head', loco.gazeDir, delta, {
          minAngle: -30,
          maxAngle: 30,
          smoothing: 0.4,
          weight: 0.6,
        })
      }
    }
  }

  let firstPersonActive = false
  const setFirstPerson = active => {
    if (firstPersonActive === active) return
    const head = gazeController.findBone('neck')
    const scale = active ? 0 : 1
    head.setLocalScale(scale, scale, scale)
    firstPersonActive = active
  }

  const setLocomotion = (mode, axis, gazeDir) => {
    animationSystem.setLocomotion(mode, axis, gazeDir)
  }

  const setEmote = url => {
    animationSystem.setEmote(url)
  }

  return {
    raw: vrm,
    height,
    headToHeight,
    setEmote,
    setFirstPerson,
    update,
    updateRate,
    getBoneTransform,
    setLocomotion,
    setVisible(visible) {
      function setVis(entity) {
        entity.enabled = visible
        for (let i = 0; i < entity.children.length; i++) {
          setVis(entity.children[i])
        }
      }
      setVis(vrm.scene)
    },
    move(_matrix) {
      matrix.copy(_matrix)
      vrm.scene.setLocalMatrix(_matrix)
      hooks.octree?.move(sItem)
    },
    disableRateCheck() {
      animationSystem.disableRateCheck()
    },
    destroy() {
      hooks.scene.removeChild(vrm.scene)
      hooks.octree?.remove(sItem)
    },
  }
}

export function setupDefaultPoses(animationSystem) {
  animationSystem.poseSystem.addPose('idle', Emotes.IDLE)
  animationSystem.poseSystem.addPose('walk', Emotes.WALK)
  animationSystem.poseSystem.addPose('walkLeft', Emotes.WALK_LEFT)
  animationSystem.poseSystem.addPose('walkBack', Emotes.WALK_BACK)
  animationSystem.poseSystem.addPose('walkRight', Emotes.WALK_RIGHT)
  animationSystem.poseSystem.addPose('run', Emotes.RUN)
  animationSystem.poseSystem.addPose('runLeft', Emotes.RUN_LEFT)
  animationSystem.poseSystem.addPose('runBack', Emotes.RUN_BACK)
  animationSystem.poseSystem.addPose('runRight', Emotes.RUN_RIGHT)
  animationSystem.poseSystem.addPose('jump', Emotes.JUMP)
  animationSystem.poseSystem.addPose('fall', Emotes.FALL)
  animationSystem.poseSystem.addPose('fly', Emotes.FLY)
  animationSystem.poseSystem.addPose('talk', Emotes.TALK)
}
