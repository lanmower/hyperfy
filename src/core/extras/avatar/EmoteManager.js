import { Emotes } from '../playerEmotes.js'
import * as THREE from '../three.js'

export class EmoteManager {
  constructor(vrm, mixer, skeletonBoneMap) {
    this.vrm = vrm
    this.mixer = mixer
    this.skeletonBoneMap = skeletonBoneMap
    this.currentEmoteAction = null
    this.emoteBlendTime = 0.5
  }

  playEmote(emoteName) {
    if (!Emotes[emoteName]) {
      console.warn(`[EmoteManager] Emote not found: ${emoteName}`)
      return
    }

    if (this.currentEmoteAction) {
      this.currentEmoteAction.fadeOut(this.emoteBlendTime)
    }

    const clip = Emotes[emoteName].clip
    const action = this.mixer.clipAction(clip)
    action.reset()
    action.fadeIn(this.emoteBlendTime)
    action.play()
    this.currentEmoteAction = action

    return {
      stop: () => this.stopEmote(),
      finished: action.loop === THREE.LoopOnce,
    }
  }

  stopEmote() {
    if (this.currentEmoteAction) {
      this.currentEmoteAction.fadeOut(this.emoteBlendTime)
      this.currentEmoteAction = null
    }
  }

  update(delta) {
    this.mixer.update(delta)
  }

  dispose() {
    this.mixer.stopAllAction()
    this.currentEmoteAction = null
  }
}
