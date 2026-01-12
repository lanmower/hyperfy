import { Node } from './Node.js'
import { initializeNode } from './base/NodeConstructorHelper.js'
import { createSchemaProxy } from '../utils/helpers/NodeSchemaHelper.js'
import { schema } from '../utils/validation/index.js'
import { AudioPlaybackController } from './audio/AudioPlaybackController.js'
import { AudioPannerController } from './audio/AudioPannerController.js'
import { StateInitializer } from './base/StateInitializer.js'

const propertySchema = schema('src', 'volume', 'loop', 'group', 'spatial', 'distanceModel', 'refDistance', 'maxDistance', 'rolloffFactor', 'coneInnerAngle', 'coneOuterAngle', 'coneOuterGain')
  .override('volume', { onSet() { if (this.gainNode) this.gainNode.gain.value = this._volume } })
  .override('distanceModel', { onSet() { if (this.pannerNode) this.pannerNode.distanceModel = this._distanceModel } })
  .override('refDistance', { onSet() { if (this.pannerNode) this.pannerNode.refDistance = this._refDistance } })
  .override('maxDistance', { onSet() { if (this.pannerNode) this.pannerNode.maxDistance = this._maxDistance } })
  .override('rolloffFactor', { onSet() { if (this.pannerNode) this.pannerNode.rolloffFactor = this._rolloffFactor } })
  .override('coneInnerAngle', { onSet() { if (this.pannerNode) this.pannerNode.coneInnerAngle = this._coneInnerAngle } })
  .override('coneOuterAngle', { onSet() { if (this.pannerNode) this.pannerNode.coneOuterAngle = this._coneOuterAngle } })
  .override('coneOuterGain', { onSet() { if (this.pannerNode) this.pannerNode.coneOuterGain = this._coneOuterGain } })
  .build()

export class Audio extends Node {
  constructor(data = {}) {
    super(data)
    initializeNode(this, 'audio', propertySchema, {}, data)

    StateInitializer.mergeState(this, StateInitializer.initAudioState())
    this.playback = new AudioPlaybackController(this)
  }

  async mount() {
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.needsRebuild = false
      if (this.source) {
        this.playback.pause()
        this.playback.play()
      }
      return
    }
    if (didMove) {
      this.updatePannerPosition()
    }
  }

  unmount() {
    this.playback.stop()
  }

  updatePannerPosition() {
    AudioPannerController.updatePannerPosition(this)
  }

  get currentTime() {
    return this.playback.currentTime
  }

  set currentTime(time) {
    this.playback.currentTime = time
  }

  get isPlaying() {
    return this.playback.isPlaying
  }

  async play(restartIfPlaying = false) {
    return this.playback.play(restartIfPlaying)
  }

  pause() {
    return this.playback.pause()
  }

  stop() {
    return this.playback.stop()
  }

  setPlaybackRate(rate) {
    return this.playback.setPlaybackRate(rate)
  }

  getProxy() {
    return createSchemaProxy(this, propertySchema, {
      play: this.play,
      pause: this.pause,
      stop: this.stop,
      setPlaybackRate: this.setPlaybackRate,
    })
  }
}
