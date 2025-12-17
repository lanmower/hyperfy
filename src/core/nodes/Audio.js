import * as THREE from '../extras/three.js'
import { every, isNumber, isString } from 'lodash-es'

import { Node } from './Node.js'
import { v, q } from '../utils/TempVectors.js'
import { defineProps, createPropertyProxy } from '../../utils/helpers/defineProperty.js'
import { schema } from '../../utils/validation/createNodeSchema.js'

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
    this.name = 'audio'
    defineProps(this, propertySchema, defaults, data)

    this.n = 0
    this.source = null
    this.gainNode = null
    this.pannerNode = null

    this.offset = 0
    this.shouldPlay = false
    this.startTime = null
  }

  async mount() {
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.needsRebuild = false
      if (this.source) {
        this.pause()
        this.play()
      }
      return
    }
    if (didMove) {
      this.updatePannerPosition()
    }
  }

  unmount() {
    this.stop()
  }

  updatePannerPosition() {
    if (!this.pannerNode) return
    const audio = this.ctx.world.audio
    const pos = v[0].setFromMatrixPosition(this.matrixWorld)
    const qua = q[0].setFromRotationMatrix(this.matrixWorld)
    const dir = v[1].set(0, 0, -1).applyQuaternion(qua)
    if (this.pannerNode.positionX) {
      const endTime = audio.ctx.currentTime + audio.lastDelta
      this.pannerNode.positionX.linearRampToValueAtTime(pos.x, endTime)
      this.pannerNode.positionY.linearRampToValueAtTime(pos.y, endTime)
      this.pannerNode.positionZ.linearRampToValueAtTime(pos.z, endTime)
      this.pannerNode.orientationX.linearRampToValueAtTime(dir.x, endTime)
      this.pannerNode.orientationY.linearRampToValueAtTime(dir.y, endTime)
      this.pannerNode.orientationZ.linearRampToValueAtTime(dir.z, endTime)
    } else {
      this.pannerNode.setPosition(pos.x, pos.y, pos.z)
      this.pannerNode.setOrientation(dir.x, dir.y, dir.z)
    }
  }

  get currentTime() {
    const audio = this.ctx.world.audio
    if (!audio) {
      return 0
    }
    if (this.source) {
      return audio.ctx.currentTime - this.startTime
    }
    return this.offset
  }

  set currentTime(time) {
    if (!isNumber(time)) {
      throw new Error('[audio] currentTime not a number')
    }
    const offset = Math.max(0, time)
    if (this.source) {
      this.stop()
      this.offset = offset
      this.play()
    } else {
      this.offset = offset
    }
  }

  get isPlaying() {
    return !!this.source
  }

  async play(restartIfPlaying = false) {
    if (!this.ctx.world) return // not mounted
    const loader = this.ctx.world.loader
    const audio = this.ctx.world.audio
    if (!audio) return
    if (!this._src) return
    if (restartIfPlaying) this.stop()
    if (this.source) return
    const n = ++this.n
    let buffer
    try {
      buffer = loader.get('audio', this._src)
      if (!buffer) buffer = await loader.load('audio', this._src)
    } catch (err) {
      console.error(err)
      return
    }
    if (n !== this.n) return

    this.source = audio.ctx.createBufferSource()
    this.source.buffer = buffer
    this.source.loop = this._loop

    this.gainNode = audio.ctx.createGain()
    this.gainNode.gain.value = this._volume

    if (this._spatial) {
      this.pannerNode = audio.ctx.createPanner()
      this.pannerNode.panningModel = 'HRTF'
      this.pannerNode.distanceModel = this._distanceModel
      this.pannerNode.refDistance = this._refDistance
      this.pannerNode.maxDistance = this._maxDistance
      this.pannerNode.rolloffFactor = this._rolloffFactor
      this.pannerNode.coneInnerAngle = this._coneInnerAngle
      this.pannerNode.coneOuterAngle = this._coneOuterAngle
      this.pannerNode.coneOuterGain = this._coneOuterGain
      this.source.connect(this.gainNode)
      this.gainNode.connect(this.pannerNode)
      this.pannerNode.connect(audio.groupGains[this._group])
      this.updatePannerPosition()
    } else {
      this.source.connect(this.gainNode)
      this.gainNode.connect(audio.groupGains[this._group])
    }

    audio.ready(() => {
      if (n !== this.n) return
      this.startTime = audio.ctx.currentTime - this.offset
      this.source.start(0, this.offset)
      if (!this._loop) {
        this.source.onended = () => this.stop()
      }
    })
  }

  pause() {
    const audio = this.ctx.world.audio
    if (!audio) return
    if (this.source) {
      this.n++
      this.offset = audio.ctx.currentTime - this.startTime
      this.source.onended = null
      this.source.stop()
      this.source = null
      this.gainNode?.disconnect()
      this.gainNode = null
      this.pannerNode?.disconnect()
      this.pannerNode = null
    }
  }

  stop() {
    const audio = this.ctx.world.audio
    if (!audio) return
    this.n++
    this.offset = 0
    if (this.source) {
      this.source.onended = null
      this.source?.stop()
      this.source = null
      this.gainNode?.disconnect()
      this.gainNode = null
      this.pannerNode?.disconnect()
      this.pannerNode = null
    }
  }

  setPlaybackRate(rate) {
    const audio = this.ctx.world.audio
    const endTime = audio.ctx.currentTime + audio.lastDelta
    this.source?.playbackRate.linearRampToValueAtTime(rate, endTime)
  }

  getProxy() {
    if (!this.proxy) {
      this.proxy = createPropertyProxy(this, propertySchema, super.getProxy(), {
        play: this.play,
        pause: this.pause,
        stop: this.stop,
        setPlaybackRate: this.setPlaybackRate,
      })
    }
    return this.proxy
  }
}

function isDistanceModel(value) {
  return distanceModels.includes(value)
}

function isGroup(value) {
  return groups.includes(value)
}
