import * as THREE from '../three.js'
import { Emotes } from '../playerEmotes.js'
import { getQueryParams } from './VRMUtilities.js'

export class PoseManager {
  constructor(mixer, hooks, rootToHips, version, getBoneName) {
    this.mixer = mixer
    this.hooks = hooks
    this.rootToHips = rootToHips
    this.version = version
    this.getBoneName = getBoneName
    this.poses = {}
    this.initializePoses()
  }

  initializePoses() {
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
      this.hooks.loader.load('emote', url).then(emo => {
        const clip = emo.toClip({
          rootToHips: this.rootToHips,
          version: this.version,
          getBoneName: this.getBoneName,
        })
        pose.action = this.mixer.clipAction(clip)
        pose.action.timeScale = speed
        pose.action.weight = pose.weight
        pose.action.play()
      })
      this.poses[key] = pose
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
  }

  clear() {
    for (const key in this.poses) {
      this.poses[key].fadeOut()
    }
  }

  getPose(key) {
    return this.poses[key]
  }

  setPoseTargets(targets) {
    for (const key in this.poses) {
      this.poses[key].target = targets[key] || 0
    }
  }

  updateWeights(delta) {
    const lerpSpeed = 16
    for (const key in this.poses) {
      const pose = this.poses[key]
      const weight = THREE.MathUtils.lerp(pose.weight, pose.target, 1 - Math.exp(-lerpSpeed * delta))
      pose.setWeight(weight)
    }
  }
}
