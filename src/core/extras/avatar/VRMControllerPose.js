import * as pc from '../playcanvas.js'
import { getQueryParams } from './VRMUtilities.js'
import { Modes } from '../../constants/AnimationModes.js'

export function createPoseSystem(mixer, hooks, rootToHips, version, getBoneName) {
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
      const weight = pc.math.lerp(pose.weight, pose.target, 1 - Math.exp(-lerpSpeed * delta))
      pose.setWeight(weight)
    }
  }

  return { poses, addPose, clear, setPoseTargets, updateWeights }
}

export function createLocomotionBlender(poseSystem) {
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
