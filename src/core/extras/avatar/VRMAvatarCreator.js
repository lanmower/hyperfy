// VRM avatar instantiation and setup
import * as THREE from '../three.js'
import { MAX_GAZE_DISTANCE } from './VRMFactoryConfig.js'
import { cloneGLB, getSkinnedMeshes, createCapsule } from './VRMUtilities.js'
import { getQueryParams } from './VRMUtilities.js'
import { Emotes } from '../playerEmotes.js'

const material = new THREE.MeshBasicMaterial()
const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const mt = new THREE.Matrix4()

export function createAvatar(glb, matrix, hooks, node, rootToHips, height, headToHeight, version) {
  const vrm = cloneGLB(glb)
  const tvrm = vrm.userData.vrm
  const skinnedMeshes = getSkinnedMeshes(vrm.scene)

  if (!skinnedMeshes.length) {
    throw new Error('Avatar has no skinned meshes')
  }

  const skeleton = skinnedMeshes[0].skeleton
  const rootBone = skeleton.bones[0]
  rootBone.parent.remove(rootBone)
  rootBone.updateMatrixWorld(true)

  vrm.scene.matrix = matrix
  vrm.scene.matrixWorld = matrix

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

  const mixer = new THREE.AnimationMixer(skinnedMeshes[0])

  const bonesByName = {}
  const findBone = name => {
    if (!bonesByName[name]) {
      const actualName = glb.userData.vrm.humanoid.getRawBoneNode(name)?.name
      bonesByName[name] = skeleton.getBoneByName(actualName)
    }
    return bonesByName[name]
  }

  const getBoneTransform = boneName => {
    const bone = findBone(boneName)
    if (!bone) return null
    return mt.multiplyMatrices(vrm.scene.matrixWorld, bone.matrixWorld)
  }

  const emotes = {}
  let currentEmote = null
  let elapsed = 0
  let rate = 0
  let rateCheck = true
  let distance = 0

  const loco = {
    mode: 0,
    axis: new THREE.Vector3(),
    gazeDir: null,
  }

  const setEmote = url => {
    if (currentEmote?.url === url) return
    if (currentEmote) {
      currentEmote.action?.fadeOut(0.15)
      currentEmote = null
    }
    if (!url) return
    const opts = getQueryParams(url)
    const loop = opts.l !== '0'
    const speed = parseFloat(opts.s || 1)
    const gaze = opts.g == '1'

    if (emotes[url]) {
      currentEmote = emotes[url]
      if (currentEmote.action) {
        currentEmote.action.clampWhenFinished = !loop
        currentEmote.action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce)
        currentEmote.action.reset().fadeIn(0.15).play()
      }
    } else {
      const emote = {
        url,
        loading: true,
        action: null,
        gaze,
      }
      emotes[url] = emote
      currentEmote = emote
      hooks.loader.load('emote', url).then(emo => {
        const clip = emo.toClip({
          rootToHips,
          version,
          getBoneName: vrmBoneName => glb.userData.vrm.humanoid.getRawBoneNode(vrmBoneName)?.name,
        })
        const action = mixer.clipAction(clip)
        action.timeScale = speed
        emote.action = action
        if (currentEmote === emote) {
          action.clampWhenFinished = !loop
          action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce)
          action.play()
        }
      })
    }
  }

  const Modes = { IDLE: 0, WALK: 1, RUN: 2, JUMP: 3, FALL: 4, FLY: 5, TALK: 6 }
  const poses = {}

  function addPose(key, url) {
    const opts = getQueryParams(url)
    const speed = parseFloat(opts.s || 1)
    const pose = {
      loading: true,
      active: false,
      action: null,
      weight: 0,
      target: 0,
      setWeight: value => {
        pose.weight = value
        if (pose.action) {
          pose.action.weight = value
          if (!pose.active) {
            pose.action.reset().fadeIn(0.15).play()
            pose.active = true
          }
        }
      },
      fadeOut: () => {
        pose.weight = 0
        pose.action?.fadeOut(0.15)
        pose.active = false
      },
    }
    hooks.loader.load('emote', url).then(emo => {
      const clip = emo.toClip({
        rootToHips,
        version,
        getBoneName: vrmBoneName => glb.userData.vrm.humanoid.getRawBoneNode(vrmBoneName)?.name,
      })
      pose.action = mixer.clipAction(clip)
      pose.action.timeScale = speed
      pose.action.weight = pose.weight
      pose.action.play()
    })
    poses[key] = pose
  }

  addPose('idle', Emotes.IDLE)
  addPose('walk', Emotes.WALK)
  addPose('walkLeft', Emotes.WALK_LEFT)
  addPose('walkBack', Emotes.WALK_BACK)
  addPose('walkRight', Emotes.WALK_RIGHT)
  addPose('run', Emotes.RUN)
  addPose('runLeft', Emotes.RUN_LEFT)
  addPose('runBack', Emotes.RUN_BACK)
  addPose('runRight', Emotes.RUN_RIGHT)
  addPose('jump', Emotes.JUMP)
  addPose('fall', Emotes.FALL)
  addPose('fly', Emotes.FLY)
  addPose('talk', Emotes.TALK)

  const clearLocomotion = () => {
    for (const key in poses) {
      poses[key].fadeOut()
    }
  }

  const updateLocomotion = delta => {
    const { mode, axis } = loco
    for (const key in poses) {
      poses[key].target = 0
    }
    if (mode === Modes.IDLE) {
      poses.idle.target = 1
    } else if (mode === Modes.WALK || mode === Modes.RUN) {
      const angle = Math.atan2(axis.x, -axis.z)
      const angleDeg = ((angle * 180) / Math.PI + 360) % 360
      const prefix = mode === Modes.RUN ? 'run' : 'walk'
      const forwardKey = prefix
      const leftKey = `${prefix}Left`
      const backKey = `${prefix}Back`
      const rightKey = `${prefix}Right`
      if (axis.length() > 0.01) {
        if (angleDeg >= 337.5 || angleDeg < 22.5) {
          poses[forwardKey].target = 1
        } else if (angleDeg >= 22.5 && angleDeg < 67.5) {
          const blend = (angleDeg - 22.5) / 45
          poses[forwardKey].target = 1 - blend
          poses[rightKey].target = blend
        } else if (angleDeg >= 67.5 && angleDeg < 112.5) {
          poses[rightKey].target = 1
        } else if (angleDeg >= 112.5 && angleDeg < 157.5) {
          const blend = (angleDeg - 112.5) / 45
          poses[rightKey].target = 1 - blend
          poses[backKey].target = blend
        } else if (angleDeg >= 157.5 && angleDeg < 202.5) {
          poses[backKey].target = 1
        } else if (angleDeg >= 202.5 && angleDeg < 247.5) {
          const blend = (angleDeg - 202.5) / 45
          poses[backKey].target = 1 - blend
          poses[leftKey].target = blend
        } else if (angleDeg >= 247.5 && angleDeg < 292.5) {
          poses[leftKey].target = 1
        } else if (angleDeg >= 292.5 && angleDeg < 337.5) {
          const blend = (angleDeg - 292.5) / 45
          poses[leftKey].target = 1 - blend
          poses[forwardKey].target = blend
        }
      }
    } else if (mode === Modes.JUMP) {
      poses.jump.target = 1
    } else if (mode === Modes.FALL) {
      poses.fall.target = 1
    } else if (mode === Modes.FLY) {
      poses.fly.target = 1
    } else if (mode === Modes.TALK) {
      poses.talk.target = 1
    }
    const lerpSpeed = 16
    for (const key in poses) {
      const pose = poses[key]
      const weight = THREE.MathUtils.lerp(pose.weight, pose.target, 1 - Math.exp(-lerpSpeed * delta))
      pose.setWeight(weight)
    }
  }

  const updateRate = () => {
    const vrmPos = v1.setFromMatrixPosition(vrm.scene.matrix)
    const camPos = v2.setFromMatrixPosition(hooks.camera.matrixWorld)
    distance = vrmPos.distanceTo(camPos)
    const DIST_MIN = 5
    const DIST_MAX = 60
    const DIST_MIN_RATE = 1 / 5
    const DIST_MAX_RATE = 1 / 60
    const clampedDistance = Math.max(distance - DIST_MIN, 0)
    const normalizedDistance = Math.min(clampedDistance / (DIST_MAX - DIST_MIN), 1)
    rate = DIST_MAX_RATE + normalizedDistance * (DIST_MIN_RATE - DIST_MAX_RATE)
  }

  const update = delta => {
    elapsed += delta
    const should = rateCheck ? elapsed >= rate : true
    if (should) {
      mixer.update(elapsed)
      skeleton.bones.forEach(bone => bone.updateMatrixWorld())
      if (!currentEmote) {
        updateLocomotion(delta)
      }
      elapsed = 0
    }
  }

  let firstPersonActive = false
  const setFirstPerson = active => {
    if (firstPersonActive === active) return
    const head = findBone('neck')
    head.scale.setScalar(active ? 0 : 1)
    firstPersonActive = active
  }

  const setLocomotion = (mode, axis, gazeDir) => {
    loco.mode = mode
    loco.axis = axis
    loco.gazeDir = gazeDir
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
      vrm.scene.matrix.copy(_matrix)
      hooks.octree?.move(sItem)
    },
    disableRateCheck() {
      rateCheck = false
    },
    destroy() {
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
