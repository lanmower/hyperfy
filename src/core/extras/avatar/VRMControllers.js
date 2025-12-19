import * as THREE from '../three.js'
import { AimAxis, UpAxis, DIST_MIN_RATE, DIST_MAX_RATE, DIST_MIN, DIST_MAX, MAX_GAZE_DISTANCE } from './VRMFactoryConfig.js'
import { getQueryParams } from './VRMUtilities.js'
import { Modes } from '../../constants/AnimationModes.js'

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const q1 = new THREE.Quaternion()

function createAimSystem(vrmSceneOrMatrix, glbVrm, skeleton) {
  const smoothedRotations = new Map()
  const bonesByName = {}

  const findBone = name => {
    if (!bonesByName[name]) {
      const actualName = glbVrm.humanoid.getRawBoneNode(name)?.name
      bonesByName[name] = skeleton.getBoneByName(actualName)
    }
    return bonesByName[name]
  }

  const aimBone = (boneName, targetDir, delta, options = {}) => {
    const {
      aimAxis = AimAxis.NEG_Z,
      upAxis = UpAxis.Y,
      smoothing = 0.7,
      weight = 1.0,
      maintainOffset = false,
      minAngle = -180,
      maxAngle = 180,
    } = options
    const bone = findBone(boneName)
    const parentBone = glbVrm.humanoid.humanBones[boneName].node.parent
    if (!bone) return console.warn(`aimBone: missing bone (${boneName})`)
    if (!parentBone) return console.warn(`aimBone: no parent bone`)
    const boneId = bone.uuid
    if (!smoothedRotations.has(boneId)) {
      smoothedRotations.set(boneId, {
        current: bone.quaternion.clone(),
        target: new THREE.Quaternion(),
      })
    }
    const smoothState = smoothedRotations.get(boneId)
    const normalizedDir = new THREE.Vector3().copy(targetDir).normalize()
    const parentWorldMatrix = new THREE.Matrix4()
    const parentWorldRotationInverse = new THREE.Quaternion()
    parentWorldMatrix.multiplyMatrices(vrmSceneOrMatrix, parentBone.matrixWorld)
    parentWorldMatrix.decompose(v1, parentWorldRotationInverse, v2)
    parentWorldRotationInverse.invert()
    const localDir = new THREE.Vector3().copy(normalizedDir).applyQuaternion(parentWorldRotationInverse)
    if (maintainOffset && !bone.userData.initialRotationOffset) {
      bone.userData.initialRotationOffset = bone.quaternion.clone()
    }
    const currentAimDir = new THREE.Vector3().copy(aimAxis)
    if (maintainOffset && bone.userData.initialRotationOffset) {
      currentAimDir.applyQuaternion(bone.userData.initialRotationOffset)
    }
    const rot = new THREE.Quaternion().setFromUnitVectors(aimAxis, localDir)
    const worldUp = new THREE.Vector3().copy(upAxis)
    const localUp = new THREE.Vector3().copy(worldUp).applyQuaternion(parentWorldRotationInverse)
    const rotatedUp = new THREE.Vector3().copy(upAxis).applyQuaternion(rot)
    const projectedUp = new THREE.Vector3().copy(localUp)
    projectedUp.sub(v1.copy(localDir).multiplyScalar(localDir.dot(localUp)))
    projectedUp.normalize()
    if (projectedUp.lengthSq() > 0.001) {
      const angle = rotatedUp.angleTo(projectedUp)
      const cross = new THREE.Vector3().crossVectors(rotatedUp, projectedUp)
      const upCorrection = new THREE.Quaternion()
      if (cross.dot(localDir) < 0) {
        upCorrection.setFromAxisAngle(localDir, -angle)
      } else {
        upCorrection.setFromAxisAngle(localDir, angle)
      }
      rot.premultiply(upCorrection)
    }
    const targetRotation = new THREE.Quaternion().copy(rot)
    if (maintainOffset && bone.userData.initialRotationOffset) {
      targetRotation.multiply(bone.userData.initialRotationOffset)
    }
    if (minAngle > -180 || maxAngle < 180) {
      if (!bone.userData.restRotation) {
        bone.userData.restRotation = bone.quaternion.clone()
      }
      const restToTarget = new THREE.Quaternion().copy(bone.userData.restRotation).invert().multiply(targetRotation)
      const w = restToTarget.w
      const angle = 2 * Math.acos(Math.min(Math.max(w, -1), 1))
      const angleDeg = THREE.MathUtils.radToDeg(angle)
      if (angleDeg > maxAngle || angleDeg < minAngle) {
        const clampedAngleDeg = THREE.MathUtils.clamp(angleDeg, minAngle, maxAngle)
        const clampedAngleRad = THREE.MathUtils.degToRad(clampedAngleDeg)
        const scale = clampedAngleRad / angle
        q1.copy(targetRotation)
        targetRotation.slerpQuaternions(bone.userData.restRotation, q1, scale)
      }
    }
    if (weight < 1.0) {
      targetRotation.slerp(bone.quaternion, 1.0 - weight)
    }
    smoothState.target.copy(targetRotation)
    smoothState.current.slerp(smoothState.target, smoothing)
    bone.quaternion.copy(smoothState.current)
    bone.updateMatrixWorld(true)
  }

  const aimBoneAt = (boneName, targetPos, getBoneTransform, delta, options = {}) => {
    const bone = findBone(boneName)
    if (!bone) return console.warn(`aimBone: missing bone (${boneName})`)
    const boneWorldMatrix = getBoneTransform(boneName)
    const boneWorldPos = v1.setFromMatrixPosition(boneWorldMatrix)
    const aimBoneDir = new THREE.Vector3().subVectors(targetPos, boneWorldPos).normalize()
    aimBone(boneName, aimBoneDir, delta, options)
  }

  return { aimBone, aimBoneAt, findBone }
}

function createPoseSystem(mixer, hooks, rootToHips, version, getBoneName) {
  const poses = {}

  const addPose = (key, url) => {
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
        getBoneName,
      })
      pose.action = mixer.clipAction(clip)
      pose.action.timeScale = speed
      pose.action.weight = pose.weight
      pose.action.play()
    })
    poses[key] = pose
  }

  const clear = () => {
    for (const key in poses) {
      poses[key].fadeOut()
    }
  }

  const setPoseTargets = targets => {
    for (const key in poses) {
      poses[key].target = targets[key] || 0
    }
  }

  const updateWeights = delta => {
    const lerpSpeed = 16
    for (const key in poses) {
      const pose = poses[key]
      const weight = THREE.MathUtils.lerp(pose.weight, pose.target, 1 - Math.exp(-lerpSpeed * delta))
      pose.setWeight(weight)
    }
  }

  return { poses, addPose, clear, setPoseTargets, updateWeights }
}

function createLocomotionBlender(poseSystem) {
  const blend = (mode, axis) => {
    const targets = {}

    if (mode === Modes.IDLE) {
      targets.idle = 1
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
          targets[forwardKey] = 1
        } else if (angleDeg >= 22.5 && angleDeg < 67.5) {
          const blend = (angleDeg - 22.5) / 45
          targets[forwardKey] = 1 - blend
          targets[rightKey] = blend
        } else if (angleDeg >= 67.5 && angleDeg < 112.5) {
          targets[rightKey] = 1
        } else if (angleDeg >= 112.5 && angleDeg < 157.5) {
          const blend = (angleDeg - 112.5) / 45
          targets[rightKey] = 1 - blend
          targets[backKey] = blend
        } else if (angleDeg >= 157.5 && angleDeg < 202.5) {
          targets[backKey] = 1
        } else if (angleDeg >= 202.5 && angleDeg < 247.5) {
          const blend = (angleDeg - 202.5) / 45
          targets[backKey] = 1 - blend
          targets[leftKey] = blend
        } else if (angleDeg >= 247.5 && angleDeg < 292.5) {
          targets[leftKey] = 1
        } else if (angleDeg >= 292.5 && angleDeg < 337.5) {
          const blend = (angleDeg - 292.5) / 45
          targets[leftKey] = 1 - blend
          targets[forwardKey] = blend
        }
      }
    } else if (mode === Modes.JUMP) {
      targets.jump = 1
    } else if (mode === Modes.FALL) {
      targets.fall = 1
    } else if (mode === Modes.FLY) {
      targets.fly = 1
    } else if (mode === Modes.TALK) {
      targets.talk = 1
    }

    poseSystem.setPoseTargets(targets)
  }

  return { blend }
}

export function createAnimationSystem(skinnedMeshes, hooks, rootToHips, version, getBoneName) {
  const mixer = new THREE.AnimationMixer(skinnedMeshes[0])
  const poseSystem = createPoseSystem(mixer, hooks, rootToHips, version, getBoneName)
  const blender = createLocomotionBlender(poseSystem)

  const emotes = {}
  let currentEmote = null
  let elapsed = 0
  let rate = 0
  let rateCheck = true
  let distance = 0

  const loco = {
    mode: Modes.IDLE,
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
        poseSystem.clear()
      }
    } else {
      const emote = { url, loading: true, action: null, gaze }
      emotes[url] = emote
      currentEmote = emote
      hooks.loader.load('emote', url).then(emo => {
        const clip = emo.toClip({ rootToHips, version, getBoneName })
        const action = mixer.clipAction(clip)
        action.timeScale = speed
        emote.action = action
        if (currentEmote === emote) {
          action.clampWhenFinished = !loop
          action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce)
          action.play()
          poseSystem.clear()
        }
      })
    }
  }

  const setLocomotion = (mode, axis, gazeDir) => {
    loco.mode = mode
    loco.axis = axis
    loco.gazeDir = gazeDir
  }

  const updateRate = (vrmMatrix, cameraMatrixWorld) => {
    const vrmPos = v1.setFromMatrixPosition(vrmMatrix)
    const camPos = v2.setFromMatrixPosition(cameraMatrixWorld)
    distance = vrmPos.distanceTo(camPos)
    const clampedDistance = Math.max(distance - DIST_MIN, 0)
    const normalizedDistance = Math.min(clampedDistance / (DIST_MAX - DIST_MIN), 1)
    rate = DIST_MAX_RATE + normalizedDistance * (DIST_MIN_RATE - DIST_MAX_RATE)
  }

  const update = delta => {
    elapsed += delta
    const should = rateCheck ? elapsed >= rate : true
    if (should) {
      mixer.update(elapsed)
      elapsed = 0
      if (!currentEmote) {
        blender.blend(loco.mode, loco.axis)
        poseSystem.updateWeights(delta)
      }
      return true
    }
    return false
  }

  const disableRateCheck = () => {
    rateCheck = false
  }

  return {
    mixer,
    poseSystem,
    setEmote,
    setLocomotion,
    updateRate,
    update,
    disableRateCheck,
    getCurrentEmote: () => currentEmote,
    getDistance: () => distance,
    getLocomotionState: () => loco,
  }
}

export { createAimSystem, createPoseSystem, createLocomotionBlender }
