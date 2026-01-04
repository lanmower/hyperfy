import * as pc from '../playcanvas.js'
import { DIST_MIN_RATE, DIST_MAX_RATE, DIST_MIN, DIST_MAX } from './VRMFactoryConfig.js'
import { StructuredLogger } from '../../utils/logging/index.js'
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'
import { createAimSystem } from './VRMControllerIK.js'
import { createPoseSystem, createLocomotionBlender } from './VRMControllerPose.js'
import { getQueryParams } from './VRMUtilities.js'
import { Modes } from '../../constants/AnimationModes.js'

const logger = new StructuredLogger('VRMControllers')
const { v1, v2 } = SharedVectorPool('VRMControllers', 2, 0)

export function createAnimationSystem(skinnedMeshes, hooks, rootToHips, version, getBoneName) {
  const mixer = { clips: {}, actions: {} }
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
    axis: new pc.Vec3(),
    gazeDir: null,
  }

  const setEmote = url => {
    if (currentEmote?.url === url) return
    if (currentEmote) {
      currentEmote.action?.stop()
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
        currentEmote.action.speed = speed
        currentEmote.action.loop = loop
        currentEmote.action.play()
        poseSystem.clear()
      }
    } else {
      const emote = { url, loading: true, action: null, gaze }
      emotes[url] = emote
      currentEmote = emote
      hooks.loader.load('emote', url).then(emo => {
        const clip = emo.toClip({ rootToHips, version, getBoneName })
        mixer.clips[url] = clip
        const action = { clip, speed, loop, playing: false, play() { this.playing = true }, stop() { this.playing = false } }
        mixer.actions[url] = action
        emote.action = action
        if (currentEmote === emote) {
          action.play()
          poseSystem.clear()
        }
      })
    }
  }

  const setLocomotion = (mode, axis, gazeDir) => {
    loco.mode = mode
    loco.axis.copy(axis)
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
      for (const key in mixer.actions) {
        const action = mixer.actions[key]
        if (action.playing) {
          action.clip.time = (action.clip.time || 0) + delta * action.speed
          if (!action.loop && action.clip.time >= action.clip.duration) {
            action.stop()
          }
        }
      }
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
