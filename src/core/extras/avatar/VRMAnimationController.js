import * as THREE from '../three.js'
import { DIST_MIN_RATE, DIST_MAX_RATE, DIST_MIN, DIST_MAX, MAX_GAZE_DISTANCE } from './VRMFactoryConfig.js'
import { getQueryParams } from './VRMUtilities.js'
import { PoseManager } from './PoseManager.js'
import { LocomotionDirectionBlender } from './LocomotionDirectionBlender.js'

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()

export class VRMAnimationController {
  constructor(skinnedMesh, vrm, hooks, rootToHips, version, getBoneName, findBone, getBoneTransform, aimBone) {
    this.mixer = new THREE.AnimationMixer(skinnedMesh)
    this.vrm = vrm
    this.hooks = hooks
    this.rootToHips = rootToHips
    this.version = version
    this.getBoneName = getBoneName
    this.findBone = findBone
    this.getBoneTransform = getBoneTransform
    this.aimBone = aimBone
    this.skeleton = skinnedMesh.skeleton

    this.elapsed = 0
    this.rate = 0
    this.rateCheck = true
    this.distance = 0

    this.emotes = {}
    this.currentEmote = null

    this.poseManager = new PoseManager(this.mixer, hooks, rootToHips, version, getBoneName)
    this.locomotionBlender = new LocomotionDirectionBlender(this.poseManager)
    this.locomotion = {
      mode: null,
      axis: new THREE.Vector3(),
      gazeDir: null,
    }
  }

  setEmote(url) {
    if (this.currentEmote?.url === url) return
    if (this.currentEmote) {
      this.currentEmote.action?.fadeOut(0.15)
      this.currentEmote = null
    }
    if (!url) return

    const opts = getQueryParams(url)
    const loop = opts.l !== '0'
    const speed = parseFloat(opts.s || 1)
    const gaze = opts.g == '1'

    if (this.emotes[url]) {
      this.currentEmote = this.emotes[url]
      if (this.currentEmote.action) {
        this.currentEmote.action.clampWhenFinished = !loop
        this.currentEmote.action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce)
        this.currentEmote.action.reset().fadeIn(0.15).play()
        this.clearLocomotion()
      }
    } else {
      const emote = { url, loading: true, action: null, gaze }
      this.emotes[url] = emote
      this.currentEmote = emote
      this.hooks.loader.load('emote', url).then(emo => {
        const clip = emo.toClip({
          rootToHips: this.rootToHips,
          version: this.version,
          getBoneName: this.getBoneName,
        })
        const action = this.mixer.clipAction(clip)
        action.timeScale = speed
        emote.action = action
        if (this.currentEmote === emote) {
          action.clampWhenFinished = !loop
          action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce)
          action.play()
          this.clearLocomotion()
        }
      })
    }
  }

  clearLocomotion() {
    this.poseManager.clear()
  }

  updateLocomotion(delta) {
    const { mode, axis } = this.locomotion
    this.locomotionBlender.blend(mode, axis)
    this.poseManager.updateWeights(delta)
  }

  updateRate(vrmMatrix, cameraMatrix) {
    const vrmPos = v1.setFromMatrixPosition(vrmMatrix)
    const camPos = v2.setFromMatrixPosition(cameraMatrix)
    this.distance = vrmPos.distanceTo(camPos)
    const clampedDistance = Math.max(this.distance - DIST_MIN, 0)
    const normalizedDistance = Math.min(clampedDistance / (DIST_MAX - DIST_MIN), 1)
    this.rate = DIST_MAX_RATE + normalizedDistance * (DIST_MIN_RATE - DIST_MAX_RATE)
  }

  update(delta, vrmMatrix) {
    this.elapsed += delta
    const should = this.rateCheck ? this.elapsed >= this.rate : true
    if (should) {
      this.mixer.update(this.elapsed)
      this.skeleton.bones.forEach(bone => bone.updateMatrixWorld())
      this.skeleton.update = THREE.Skeleton.prototype.update
      if (!this.currentEmote) {
        this.updateLocomotion(delta)
      }
      if (this.locomotion.gazeDir && this.distance < MAX_GAZE_DISTANCE && (this.currentEmote ? this.currentEmote.gaze : true)) {
        this.aimBone('neck', this.locomotion.gazeDir, delta, {
          minAngle: -30,
          maxAngle: 30,
          smoothing: 0.4,
          weight: 0.6,
        })
        this.aimBone('head', this.locomotion.gazeDir, delta, {
          minAngle: -30,
          maxAngle: 30,
          smoothing: 0.4,
          weight: 0.6,
        })
      }
      this.elapsed = 0
    } else {
      this.skeleton.update = () => {}
    }
  }

  setLocomotion(mode, axis, gazeDir) {
    this.locomotion.mode = mode
    this.locomotion.axis = axis
    this.locomotion.gazeDir = gazeDir
  }

  disableRateCheck() {
    this.rateCheck = false
  }
}
