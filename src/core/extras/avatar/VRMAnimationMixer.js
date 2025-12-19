import * as THREE from '../three.js'
import { getQueryParams } from './VRMUtilities.js'
import { DIST_MIN_RATE, DIST_MAX_RATE, DIST_MIN, DIST_MAX } from './VRMFactoryConfig.js'

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()

export class VRMAnimationMixer {
  constructor(skinnedMeshes, hooks, rootToHips, version, getBoneName, clearLocomotion) {
    this.mixer = new THREE.AnimationMixer(skinnedMeshes[0])
    this.hooks = hooks
    this.rootToHips = rootToHips
    this.version = version
    this.getBoneName = getBoneName
    this.clearLocomotion = clearLocomotion
    this.emotes = {}
    this.currentEmote = null
    this.elapsed = 0
    this.rate = 0
    this.rateCheck = true
    this.distance = 0
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
      const emote = {
        url,
        loading: true,
        action: null,
        gaze,
      }
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

  updateRate(vrmMatrix, cameraMatrixWorld) {
    const vrmPos = v1.setFromMatrixPosition(vrmMatrix)
    const camPos = v2.setFromMatrixPosition(cameraMatrixWorld)
    this.distance = vrmPos.distanceTo(camPos)
    const clampedDistance = Math.max(this.distance - DIST_MIN, 0)
    const normalizedDistance = Math.min(clampedDistance / (DIST_MAX - DIST_MIN), 1)
    this.rate = DIST_MAX_RATE + normalizedDistance * (DIST_MIN_RATE - DIST_MAX_RATE)
  }

  update(delta) {
    this.elapsed += delta
    const should = this.rateCheck ? this.elapsed >= this.rate : true
    if (should) {
      this.mixer.update(this.elapsed)
      this.elapsed = 0
      return true
    }
    return false
  }

  disableRateCheck() {
    this.rateCheck = false
  }

  getCurrentEmote() {
    return this.currentEmote
  }

  getDistance() {
    return this.distance
  }
}
