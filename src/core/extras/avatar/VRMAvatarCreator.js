// VRM avatar instantiation and setup
import * as THREE from '../three.js'
import { MAX_GAZE_DISTANCE } from './VRMFactoryConfig.js'
import { cloneGLB, getSkinnedMeshes, createCapsule } from './VRMUtilities.js'
import { createAnimationSystem, createAimSystem } from './VRMControllers.js'
import { Emotes } from '../playerEmotes.js'

const material = new THREE.MeshBasicMaterial()

export function createAvatar(glb, matrix, hooks, node, rootToHips, height, headToHeight, version) {
  const vrm = cloneGLB(glb)
  const tvrm = vrm.userData.vrm
  const skinnedMeshes = getSkinnedMeshes(vrm.scene)
  const skeleton = skinnedMeshes[0].skeleton
  const rootBone = skeleton.bones[0]
  rootBone.parent.remove(rootBone)
  rootBone.updateMatrixWorld(true)
  vrm.scene.matrix = matrix
  vrm.scene.matrixWorld = matrix
  hooks.scene.add(vrm.scene)

  const getEntity = () => node?.ctx.entity

  const cRadius = 0.3
  const sItem = {
    matrix,
    geometry: createCapsule(cRadius, height - cRadius * 2),
    material,
    getEntity,
  }
  hooks.octree?.insert(sItem)

  vrm.scene.traverse(o => {
    o.getEntity = getEntity
  })

  const getBoneName = vrmBoneName => {
    return glb.userData.vrm.humanoid.getRawBoneNode(vrmBoneName)?.name
  }

  const animationSystem = createAnimationSystem(skinnedMeshes, hooks, rootToHips, version, getBoneName)
  const gazeController = createAimSystem(vrm.scene.matrixWorld, glb.userData.vrm, skeleton)

  setupDefaultPoses(animationSystem)

  const mt = new THREE.Matrix4()
  const getBoneTransform = boneName => {
    const bone = gazeController.findBone(boneName)
    if (!bone) return null
    return mt.multiplyMatrices(vrm.scene.matrixWorld, bone.matrixWorld)
  }

  const updateRate = () => {
    animationSystem.updateRate(vrm.scene.matrix, hooks.camera.matrixWorld)
  }

  const update = delta => {
    const shouldUpdate = animationSystem.update(delta)
    if (shouldUpdate) {
      skeleton.bones.forEach(bone => bone.updateMatrixWorld())
      skeleton.update = THREE.Skeleton.prototype.update
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
    } else {
      skeleton.update = () => {}
    }
  }

  let firstPersonActive = false
  const setFirstPerson = active => {
    if (firstPersonActive === active) return
    const head = gazeController.findBone('neck')
    head.scale.setScalar(active ? 0 : 1)
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
      vrm.scene.traverse(o => {
        o.visible = visible
      })
    },
    move(_matrix) {
      matrix.copy(_matrix)
      hooks.octree?.move(sItem)
    },
    disableRateCheck() {
      animationSystem.disableRateCheck()
    },
    destroy() {
      hooks.scene.remove(vrm.scene)
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
