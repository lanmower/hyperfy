import { SharedVectorPool } from '../utils/SharedVectorPool.js'
import { EVENT } from '../constants/EventNames.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('ClientLiveKitParticipants')
const { v1, v2, q1 } = SharedVectorPool('ClientLiveKitParticipants', 2, 1)

export class ClientLiveKitParticipants {
  constructor(clientLiveKit) {
    this.clientLiveKit = clientLiveKit
  }

  createVoiceController(player, level, muted, track, participant) {
    track.setAudioContext(this.clientLiveKit.audio.ctx)
    const root = this.clientLiveKit.audio.ctx.createGain()
    const panner = this.clientLiveKit.audio.ctx.createPanner()
    panner.panningModel = 'HRTF'
    panner.distanceModel = 'inverse'
    panner.refDistance = 1
    panner.maxDistance = 40
    panner.rolloffFactor = 3
    panner.coneInnerAngle = 360
    panner.coneOuterAngle = 360
    panner.coneOuterGain = 0
    const gain = this.clientLiveKit.audio.groupGains.voice
    root.connect(gain)
    root.connect(panner)
    panner.connect(gain)
    track.attach()
    const applyAudioSettings = () => {
      if (muted || level === 'disabled') {
        root.gain.value = 0
        track.setWebAudioPlugins([root])
      } else if (level === 'spatial') {
        root.gain.value = 1
        track.setWebAudioPlugins([panner])
      } else {
        root.gain.value = 1
        track.setWebAudioPlugins([root])
      }
    }
    const updateSpatialAudio = () => {
      if (muted || level !== 'spatial') return
      const matrix = player.base.matrixWorld
      const pos = v1.setFromMatrixPosition(matrix)
      const qua = q1.setFromRotationMatrix(matrix)
      const dir = v2.set(0, 0, -1).applyQuaternion(qua)
      if (panner.positionX) {
        const endTime = this.clientLiveKit.audio.ctx.currentTime + this.clientLiveKit.audio.lastDelta
        panner.positionX.linearRampToValueAtTime(pos.x, endTime)
        panner.positionY.linearRampToValueAtTime(pos.y, endTime)
        panner.positionZ.linearRampToValueAtTime(pos.z, endTime)
        panner.orientationX.linearRampToValueAtTime(dir.x, endTime)
        panner.orientationY.linearRampToValueAtTime(dir.y, endTime)
        panner.orientationZ.linearRampToValueAtTime(dir.z, endTime)
      } else {
        panner.setPosition(pos.x, pos.y, pos.z)
        panner.setOrientation(dir.x, dir.y, dir.z)
      }
    }
    applyAudioSettings()
    this.clientLiveKit.voices.set(player.data.id, {
      player, track, participant, root, panner, gain,
      get level() { return level },
      get muted() { return muted },
      setMuted: val => { if (muted !== val) { muted = val; applyAudioSettings() } },
      setLevel: val => { if (level !== val) { level = val; applyAudioSettings() } },
      lateUpdate: updateSpatialAudio,
      destroy: () => {
        this.clientLiveKit.events.emit(EVENT.speaking, { playerId: player.data.id, speaking: false })
        player.setSpeaking(false)
        track.detach()
      },
    })
  }

  setMuted(playerId, muted) {
    if (muted && this.clientLiveKit.muted.has(playerId)) return
    if (!muted && !this.clientLiveKit.muted.has(playerId)) return
    if (muted) {
      this.clientLiveKit.muted.add(playerId)
    } else {
      this.clientLiveKit.muted.delete(playerId)
    }
    const voice = this.clientLiveKit.voices.get(playerId)
    voice?.setMuted(muted)
    this.clientLiveKit.events.emit('playerMuted', { playerId, muted })
    if (playerId === this.clientLiveKit.network.id) {
      this.clientLiveKit.status.muted = muted
      this.clientLiveKit.events.emit(EVENT.livekit, this.clientLiveKit.status)
    }
  }

  isMuted(playerId) {
    return this.clientLiveKit.muted.has(playerId)
  }

  setLevel(playerId, level) {
    this.clientLiveKit.levels[playerId] = level
    level = level || this.clientLiveKit.defaultLevel
    if (playerId === this.clientLiveKit.network.id) {
      if (this.clientLiveKit.status.level !== level) {
        this.clientLiveKit.status.level = level
        this.clientLiveKit.events.emit(EVENT.livekit, this.clientLiveKit.status)
      }
      return
    }
    const voice = this.clientLiveKit.voices.get(playerId)
    voice?.setLevel(level)
  }

  updateSpatial(delta) {
    this.clientLiveKit.voices.forEach(voice => {
      voice.lateUpdate(delta)
    })
  }

  destroy() {
    this.clientLiveKit.voices.forEach(voice => voice.destroy())
    this.clientLiveKit.voices.clear()
  }
}
