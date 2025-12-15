import * as THREE from '../extras/three.js'
import { every, isNumber, isString } from 'lodash-es'

import { Node } from './Node.js'
import { v, q } from '../utils/TempVectors.js'
import { audioGroups as groups, distanceModels } from '../utils/AudioConstants.js'
import { defineProps, validators } from '../utils/defineProperty.js'

const defaults = {
  src: null,
  volume: 1,
  loop: false,
  group: 'music',
  // see: https://medium.com/@kfarr/understanding-web-audio-api-positional-audio-distance-models-for-webxr-e77998afcdff
  spatial: true,
  distanceModel: 'inverse',
  refDistance: 1,
  maxDistance: 40,
  rolloffFactor: 3,
  coneInnerAngle: 360,
  coneOuterAngle: 360,
  coneOuterGain: 0,
}

const propertySchema = {
  src: {
    default: defaults.src,
    validate: (value) => (!isString(value) && value !== null) ? 'must be string or null' : null,
    onSet() { this.needsRebuild = true; this.setDirty() },
  },
  volume: {
    default: defaults.volume,
    validate: validators.number,
    onSet() { if (this.gainNode) this.gainNode.gain.value = this._volume },
  },
  loop: {
    default: defaults.loop,
    validate: validators.boolean,
    onSet() { this.needsRebuild = true; this.setDirty() },
  },
  group: {
    default: defaults.group,
    validate: (value) => !groups.includes(value) ? 'invalid group' : null,
    onSet() { this.needsRebuild = true; this.setDirty() },
  },
  spatial: {
    default: defaults.spatial,
    validate: validators.boolean,
    onSet() { this.needsRebuild = true; this.setDirty() },
  },
  distanceModel: {
    default: defaults.distanceModel,
    validate: (value) => !distanceModels.includes(value) ? 'invalid distanceModel' : null,
    onSet() { if (this.pannerNode) this.pannerNode.distanceModel = this._distanceModel },
  },
  refDistance: {
    default: defaults.refDistance,
    validate: validators.number,
    onSet() { if (this.pannerNode) this.pannerNode.refDistance = this._refDistance },
  },
  maxDistance: {
    default: defaults.maxDistance,
    validate: validators.number,
    onSet() { if (this.pannerNode) this.pannerNode.maxDistance = this._maxDistance },
  },
  rolloffFactor: {
    default: defaults.rolloffFactor,
    validate: validators.number,
    onSet() { if (this.pannerNode) this.pannerNode.rolloffFactor = this._rolloffFactor },
  },
  coneInnerAngle: {
    default: defaults.coneInnerAngle,
    validate: validators.number,
    onSet() { if (this.pannerNode) this.pannerNode.coneInnerAngle = this._coneInnerAngle },
  },
  coneOuterAngle: {
    default: defaults.coneOuterAngle,
    validate: validators.number,
    onSet() { if (this.pannerNode) this.pannerNode.coneOuterAngle = this._coneOuterAngle },
  },
  coneOuterGain: {
    default: defaults.coneOuterGain,
    validate: validators.number,
    onSet() { if (this.pannerNode) this.pannerNode.coneOuterGain = this._coneOuterGain },
  },
}

export class Audio extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'audio'
    defineProps(this, propertySchema, defaults)

    this.src = data.src
    this.volume = data.volume
    this.loop = data.loop
    this.group = data.group
    this.spatial = data.spatial
    this.distanceModel = data.distanceModel
    this.refDistance = data.refDistance
    this.maxDistance = data.maxDistance
    this.rolloffFactor = data.rolloffFactor
    this.coneInnerAngle = data.coneInnerAngle
    this.coneOuterAngle = data.coneOuterAngle
    this.coneOuterGain = data.coneOuterGain

    this.n = 0
    this.source = null
    this.gainNode = null
    this.pannerNode = null

    this.offset = 0
    this.shouldPlay = false
    this.startTime = null
  }

  async mount() {
    // ...
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

  copy(source, recursive) {
    super.copy(source, recursive)
    for (const key in propertySchema) {
      this[`_${key}`] = source[`_${key}`]
    }
    return this
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
    var self = this
    if (!this.proxy) {
      let proxy = {
        get src() {
          return self.src
        },
        set src(value) {
          self.src = value
        },
        get volume() {
          return self.volume
        },
        set volume(value) {
          self.volume = value
        },
        get loop() {
          return self.loop
        },
        set loop(value) {
          self.loop = value
        },
        get group() {
          return self.group
        },
        set group(value) {
          self.group = value
        },
        get spatial() {
          return self.spatial
        },
        set spatial(value) {
          self.spatial = value
        },
        get distanceModel() {
          return self.distanceModel
        },
        set distanceModel(value) {
          self.distanceModel = value
        },
        get refDistance() {
          return self.refDistance
        },
        set refDistance(value) {
          self.refDistance = value
        },
        get maxDistance() {
          return self.maxDistance
        },
        set maxDistance(value) {
          self.maxDistance = value
        },
        get rolloffFactor() {
          return self.rolloffFactor
        },
        set rolloffFactor(value) {
          self.rolloffFactor = value
        },
        get coneInnerAngle() {
          return self.coneInnerAngle
        },
        set coneInnerAngle(value) {
          self.coneInnerAngle = value
        },
        get coneOuterAngle() {
          return self.coneOuterAngle
        },
        set coneOuterAngle(value) {
          self.coneOuterAngle = value
        },
        get coneOuterGain() {
          return self.coneOuterGain
        },
        set coneOuterGain(value) {
          self.coneOuterGain = value
        },
        play(restartIfPlaying) {
          self.play(restartIfPlaying)
        },
        pause() {
          self.pause()
        },
        stop() {
          self.stop()
        },
        setPlaybackRate(rate) {
          self.setPlaybackRate(rate)
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
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
