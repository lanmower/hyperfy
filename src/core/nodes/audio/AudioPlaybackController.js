import { isNumber } from '../../utils/helpers/typeChecks.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('AudioPlaybackController')

export class AudioPlaybackController {
  constructor(audioNode) {
    this.node = audioNode
  }

  async play(restartIfPlaying = false) {
    if (!this.node.ctx.world) return
    const loader = this.node.ctx.world.loader
    const audio = this.node.ctx.world.audio
    if (!audio) return
    if (!this.node._src) return
    if (restartIfPlaying) this.stop()
    if (this.node.source) return
    const n = ++this.node.n
    let buffer
    try {
      buffer = loader.get('audio', this.node._src)
      if (!buffer) buffer = await loader.load('audio', this.node._src)
    } catch (err) {
      logger.error('Failed to load audio', { source: this.node._src, error: err.message })
      return
    }
    if (n !== this.node.n) return

    this.node.source = audio.ctx.createBufferSource()
    this.node.source.buffer = buffer
    this.node.source.loop = this.node._loop

    this.node.gainNode = audio.ctx.createGain()
    this.node.gainNode.gain.value = this.node._volume

    if (this.node._spatial) {
      this.node.pannerNode = audio.ctx.createPanner()
      this.node.pannerNode.panningModel = 'HRTF'
      this.node.pannerNode.distanceModel = this.node._distanceModel
      this.node.pannerNode.refDistance = this.node._refDistance
      this.node.pannerNode.maxDistance = this.node._maxDistance
      this.node.pannerNode.rolloffFactor = this.node._rolloffFactor
      this.node.pannerNode.coneInnerAngle = this.node._coneInnerAngle
      this.node.pannerNode.coneOuterAngle = this.node._coneOuterAngle
      this.node.pannerNode.coneOuterGain = this.node._coneOuterGain
      this.node.source.connect(this.node.gainNode)
      this.node.gainNode.connect(this.node.pannerNode)
      this.node.pannerNode.connect(audio.groupGains[this.node._group])
      this.node.updatePannerPosition()
    } else {
      this.node.source.connect(this.node.gainNode)
      this.node.gainNode.connect(audio.groupGains[this.node._group])
    }

    audio.ready(() => {
      if (n !== this.node.n) return
      this.node.startTime = audio.ctx.currentTime - this.node.offset
      this.node.source.start(0, this.node.offset)
      if (!this.node._loop) {
        this.node.source.onended = () => this.stop()
      }
    })
  }

  pause() {
    const audio = this.node.ctx.world.audio
    if (!audio) return
    if (this.node.source) {
      this.node.n++
      this.node.offset = audio.ctx.currentTime - this.node.startTime
      this.node.source.onended = null
      this.node.source.stop()
      this.node.source = null
      this.node.gainNode?.disconnect()
      this.node.gainNode = null
      this.node.pannerNode?.disconnect()
      this.node.pannerNode = null
    }
  }

  stop() {
    const audio = this.node.ctx.world.audio
    if (!audio) return
    this.node.n++
    this.node.offset = 0
    if (this.node.source) {
      this.node.source.onended = null
      this.node.source?.stop()
      this.node.source = null
      this.node.gainNode?.disconnect()
      this.node.gainNode = null
      this.node.pannerNode?.disconnect()
      this.node.pannerNode = null
    }
  }

  setPlaybackRate(rate) {
    const audio = this.node.ctx.world.audio
    const endTime = audio.ctx.currentTime + audio.lastDelta
    this.node.source?.playbackRate.linearRampToValueAtTime(rate, endTime)
  }

  get currentTime() {
    const audio = this.node.ctx.world.audio
    if (!audio) {
      return 0
    }
    if (this.node.source) {
      return audio.ctx.currentTime - this.node.startTime
    }
    return this.node.offset
  }

  set currentTime(time) {
    if (!isNumber(time)) {
      throw new Error('[audio] currentTime not a number')
    }
    const offset = Math.max(0, time)
    if (this.node.source) {
      this.stop()
      this.node.offset = offset
      this.play()
    } else {
      this.node.offset = offset
    }
  }

  get isPlaying() {
    return !!this.node.source
  }
}
