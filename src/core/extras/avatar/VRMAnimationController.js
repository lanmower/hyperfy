import * as THREE from '../three.js'
import { Emotes } from '../playerEmotes.js'
import { Modes } from '../constants/AnimationModes.js'
import { DIST_MIN_RATE, DIST_MAX_RATE, DIST_MIN, DIST_MAX, MAX_GAZE_DISTANCE } from './VRMFactoryConfig.js'
import { getQueryParams } from './VRMUtilities.js'

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

    this.poses = {}
    this.locomotion = {
      mode: Modes.IDLE,
      axis: new THREE.Vector3(),
      gazeDir: null,
    }

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
    for (const key in this.poses) {
      this.poses[key].fadeOut()
    }
  }

  updateLocomotion(delta) {
    const { mode, axis } = this.locomotion
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
