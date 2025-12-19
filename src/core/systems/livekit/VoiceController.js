import * as THREE from '../../extras/three.js'
import { EVENT } from '../../constants/EventNames.js'

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const q1 = new THREE.Quaternion()

export class VoiceController {
  constructor(livekit) {
    this.livekit = livekit
  }

  create(player, level, muted, track, participant) {
    track.setAudioContext(this.livekit.audio.ctx)
    const root = this.livekit.audio.ctx.createGain()
    const panner = this.livekit.audio.ctx.createPanner()
    panner.panningModel = 'HRTF'
    panner.distanceModel = 'inverse'
    panner.refDistance = 1
    panner.maxDistance = 40
    panner.rolloffFactor = 3
    panner.coneInnerAngle = 360
    panner.coneOuterAngle = 360
    panner.coneOuterGain = 0
    const gain = this.livekit.audio.groupGains.voice
    root.connect(gain)
    root.connect(panner)
    panner.connect(gain)
    track.attach()

    const voice = {
      player,
      level,
      muted,
      track,
      participant,
      root,
      panner,
      gain,
      setMuted: (val) => {
        if (voice.muted === val) return
        voice.muted = val
        voice.apply()
      },
      setLevel: (val) => {
        if (voice.level === val) return
        voice.level = val
        voice.apply()
      },
      apply: () => {
        if (voice.muted || voice.level === 'disabled') {
          voice.root.gain.value = 0
          voice.track.setWebAudioPlugins([voice.root])
        } else if (voice.level === 'spatial') {
          voice.root.gain.value = 1
          voice.track.setWebAudioPlugins([voice.panner])
        } else if (voice.level === 'global') {
          voice.root.gain.value = 1
          voice.track.setWebAudioPlugins([voice.root])
        }
      },
      lateUpdate: (delta) => {
        if (voice.muted || voice.level !== 'spatial') return
        const matrix = voice.player.base.matrixWorld
        const pos = v1.setFromMatrixPosition(matrix)
        const qua = q1.setFromRotationMatrix(matrix)
        const dir = v2.set(0, 0, -1).applyQuaternion(qua)
        if (voice.panner.positionX) {
          const endTime = this.livekit.audio.ctx.currentTime + this.livekit.audio.lastDelta
          voice.panner.positionX.linearRampToValueAtTime(pos.x, endTime)
          voice.panner.positionY.linearRampToValueAtTime(pos.y, endTime)
          voice.panner.positionZ.linearRampToValueAtTime(pos.z, endTime)
          voice.panner.orientationX.linearRampToValueAtTime(dir.x, endTime)
          voice.panner.orientationY.linearRampToValueAtTime(dir.y, endTime)
          voice.panner.orientationZ.linearRampToValueAtTime(dir.z, endTime)
        } else {
          voice.panner.setPosition(pos.x, pos.y, pos.z)
          voice.panner.setOrientation(dir.x, dir.y, dir.z)
        }
      },
      destroy: () => {
        this.livekit.events.emit(EVENT.speaking, { playerId: voice.player.data.id, speaking: false })
        voice.player.setSpeaking(false)
        voice.track.detach()
      },
    }
    voice.apply()
    this.livekit.voices.set(player.data.id, voice)
  }
}
