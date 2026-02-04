import * as THREE from '../../extras/three.js'
import { Modes } from "../../constants/AnimationModes.js"
import { PhysicsConfig, AvatarConfig } from "../../config/SystemConfig.js"
import { SharedVectorPool } from '../../utils/SharedVectorPool.js'

const FORWARD = new THREE.Vector3(0, 0, -1)
const gazeTiltAxis = new THREE.Vector3(1, 0, 0)
const gazeTiltAngle = Math.PI / 6

const { v1 } = SharedVectorPool('AnimationController', 1)

export class AnimationController {
  constructor(player) {
    this.player = player
  }

  updateAnimationMode() {
    const effect = this.player.data.effect
    const physics = this.player.physics

    let mode
    if (effect?.emote) {
      mode = Modes.TALK
    } else if (physics?.flying) {
      mode = Modes.FLY
    } else if (physics?.airJumping) {
      mode = Modes.FLIP
    } else if (physics?.jumping) {
      mode = Modes.JUMP
    } else if (physics?.falling) {
      mode = physics.fallDistance > PhysicsConfig.FALL_DAMAGE_THRESHOLD ? Modes.FALL : Modes.JUMP
    } else if (physics?.moving) {
      mode = this.player.running ? Modes.RUN : Modes.WALK
    } else if (this.player.speaking) {
      mode = Modes.TALK
    } else {
      mode = Modes.IDLE
    }

    return mode
  }

  updateGaze() {
    const isXR = this.player.world.xr?.session
    const firstPerson = this.player.firstPerson
    const gaze = this.player.gaze

    if (isXR && this.player.world.xr?.camera) {
      gaze.copy(FORWARD).applyQuaternion(this.player.world.xr.camera.quaternion)
    } else {
      gaze.copy(FORWARD).applyQuaternion(this.player.cam.quaternion)
      if (!firstPerson) {
        v1.copy(gazeTiltAxis).applyQuaternion(this.player.cam.quaternion)
        gaze.applyAxisAngle(v1, gazeTiltAngle)
      }
    }
  }

  updateEmote() {
    let emote
    if (this.player.data.effect?.emote) {
      emote = this.player.data.effect.emote
    }
    if (this.player.emote !== emote) {
      this.player.emote = emote
    }
    this.player.avatar?.setEmote?.(this.player.emote)
  }

  applyAvatarLocomotion() {
    const avatar = this.player.avatar
    const locomotionFn = avatar?.instance?.setLocomotion || avatar?.setLocomotion
    locomotionFn?.call(avatar?.instance || avatar, this.player.mode, this.player.axis, this.player.gaze)
  }
}
