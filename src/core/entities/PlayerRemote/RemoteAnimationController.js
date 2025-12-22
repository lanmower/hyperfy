import * as THREE from '../../extras/three.js'

export class RemoteAnimationController {
  constructor(player) {
    this.player = player
    this.mode = 0
    this.axis = new THREE.Vector3()
    this.gaze = new THREE.Vector3()
    this.speaking = false
  }

  updateAnimation(delta) {
    this.player.avatar?.setEmote?.(this.player.data.emote)
    this.player.avatar?.instance?.setLocomotion(this.mode, this.axis, this.gaze)
  }

  updateAnimationFromData(data) {
    if (data.hasOwnProperty('m')) {
      this.player.data.mode = data.m
      this.mode = data.m
    }
    if (data.hasOwnProperty('a')) {
      this.player.data.axis = data.a
      this.axis.fromArray(data.a)
    }
    if (data.hasOwnProperty('g')) {
      this.player.data.gaze = data.g
      this.gaze.fromArray(data.g)
    }
    if (data.hasOwnProperty('e')) {
      this.player.data.emote = data.e
    }
  }

  setSpeaking(speaking) {
    if (this.speaking === speaking) return
    if (speaking && this.player.isMuted()) return
    this.speaking = speaking
    const name = this.player.data.name
    this.player.nametag.label = speaking ? `» ${name} «` : name
  }
}
