import * as THREE from '../three.js'
import { getQueryParams } from './VRMUtilities.js'
import { Modes } from '../constants/AnimationModes.js'

export class VRMLocomotionController {
  constructor(mixer, hooks, rootToHips, version, getBoneName) {
    this.poses = {}
    this.loco = {
      mode: Modes.IDLE,
      axis: new THREE.Vector3(),
      gazeDir: null,
    }
    this.mixer = mixer
    this.hooks = hooks
    this.rootToHips = rootToHips
    this.version = version
    this.getBoneName = getBoneName
  }

  addPose(key, url) {
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

  setLocomotion(mode, axis, gazeDir) {
    this.loco.mode = mode
    this.loco.axis = axis
    this.loco.gazeDir = gazeDir
  }

  clearLocomotion() {
    for (const key in this.poses) {
      this.poses[key].fadeOut()
    }
  }

  updateLocomotion(delta) {
    const { mode, axis } = this.loco
    for (const key in this.poses) {
      this.poses[key].target = 0
    }
    if (mode === Modes.IDLE) {
      this.poses.idle.target = 1
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
          this.poses[forwardKey].target = 1
        } else if (angleDeg >= 22.5 && angleDeg < 67.5) {
          const blend = (angleDeg - 22.5) / 45
          this.poses[forwardKey].target = 1 - blend
          this.poses[rightKey].target = blend
        } else if (angleDeg >= 67.5 && angleDeg < 112.5) {
          this.poses[rightKey].target = 1
        } else if (angleDeg >= 112.5 && angleDeg < 157.5) {
          const blend = (angleDeg - 112.5) / 45
          this.poses[rightKey].target = 1 - blend
          this.poses[backKey].target = blend
        } else if (angleDeg >= 157.5 && angleDeg < 202.5) {
          this.poses[backKey].target = 1
        } else if (angleDeg >= 202.5 && angleDeg < 247.5) {
          const blend = (angleDeg - 202.5) / 45
          this.poses[backKey].target = 1 - blend
          this.poses[leftKey].target = blend
        } else if (angleDeg >= 247.5 && angleDeg < 292.5) {
          this.poses[leftKey].target = 1
        } else if (angleDeg >= 292.5 && angleDeg < 337.5) {
          const blend = (angleDeg - 292.5) / 45
          this.poses[leftKey].target = 1 - blend
          this.poses[forwardKey].target = blend
        }
      }
    } else if (mode === Modes.JUMP) {
      this.poses.jump.target = 1
    } else if (mode === Modes.FALL) {
      this.poses.fall.target = 1
    } else if (mode === Modes.FLY) {
      this.poses.fly.target = 1
    } else if (mode === Modes.TALK) {
      this.poses.talk.target = 1
    }
    const lerpSpeed = 16
    for (const key in this.poses) {
      const pose = this.poses[key]
      const weight = THREE.MathUtils.lerp(pose.weight, pose.target, 1 - Math.exp(-lerpSpeed * delta))
      pose.setWeight(weight)
    }
  }

  getLocomotionState() {
    return this.loco
  }
}
