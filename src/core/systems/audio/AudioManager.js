import { BaseManager } from '../../patterns/index.js'

export class AudioManager extends BaseManager {
  constructor(world) {
    super(world, 'AudioManager')
    this.audio = null
    this.livekit = null
    this.degraded = false
    this.status = {
      audioReady: false,
      voiceChatReady: false,
      micActive: false,
      screenshareActive: false,
    }
  }

  async initInternal() {
  }

  initialize(audio, livekit) {
    this.audio = audio
    this.livekit = livekit

    this.degraded = audio?.degraded || livekit?.degraded || false

    if (!this.degraded) {
      this.status.audioReady = !!this.audio && !this.audio.degraded
      this.status.voiceChatReady = !!this.livekit && !this.livekit.degraded
      this.logger.info('AudioManager initialized', {
        audioReady: this.status.audioReady,
        voiceChatReady: this.status.voiceChatReady,
      })
    } else {
      this.logger.warn('AudioManager operating in degraded mode', {
        audioDegraded: audio?.degraded,
        livekitDegraded: livekit?.degraded,
      })
    }
  }

  setMasterVolume(value) {
    if (!this.audio || this.audio.degraded) return
    if (this.audio.masterGain) {
      this.audio.masterGain.gain.value = Math.max(0, Math.min(1, value))
    }
  }

  setGroupVolume(group, value) {
    if (!this.audio || this.audio.degraded) return
    if (this.audio.groupGains[group]) {
      this.audio.groupGains[group].gain.value = Math.max(0, Math.min(1, value))
    }
  }

  getGroupVolume(group) {
    if (!this.audio || this.audio.degraded) return 0
    return this.audio.groupGains[group]?.gain.value || 0
  }

  setMicLevel(level) {
    if (!this.livekit || this.livekit.degraded) return
    this.livekit.defaultLevel = level
    this.livekit.status.level = level
  }

  getMicLevel() {
    if (!this.livekit || this.livekit.degraded) return 0
    return this.livekit.status.level || 0
  }

  isMicActive() {
    if (!this.livekit || this.livekit.degraded) return false
    return this.livekit.status.mic || false
  }

  isVoiceChatAvailable() {
    return !this.degraded && this.status.voiceChatReady
  }

  isAudioContextReady() {
    if (!this.audio || this.audio.degraded) return false
    return this.audio.unlocked && this.audio.ctx.state === 'running'
  }

  getAudioContext() {
    if (!this.audio || this.audio.degraded) return null
    return this.audio.ctx
  }

  getAudioListener() {
    if (!this.audio || this.audio.degraded) return null
    return this.audio.listener
  }

  ready(callback) {
    if (!this.audio || this.audio.degraded) return
    this.audio.ready(callback)
  }

  mute(playerId) {
    if (!this.livekit || this.livekit.degraded) return
    if (!this.livekit.muted.has(playerId)) {
      this.livekit.muted.add(playerId)
      const voice = this.livekit.voices.get(playerId)
      if (voice) voice.setLevel(0)
    }
  }

  unmute(playerId) {
    if (!this.livekit || this.livekit.degraded) return
    if (this.livekit.muted.has(playerId)) {
      this.livekit.muted.delete(playerId)
      const voice = this.livekit.voices.get(playerId)
      const level = this.livekit.levels[playerId] || this.livekit.defaultLevel
      if (voice) voice.setLevel(level)
    }
  }

  isMuted(playerId) {
    if (!this.livekit || this.livekit.degraded) return false
    return this.livekit.muted.has(playerId)
  }

  getVoiceController(playerId) {
    if (!this.livekit || this.livekit.degraded) return null
    return this.livekit.voices.get(playerId)
  }

  getStatus() {
    return {
      ...this.status,
      degraded: this.degraded,
      audioReady: this.isAudioContextReady(),
      voiceChatReady: this.isVoiceChatAvailable(),
      micActive: this.isMicActive(),
      masterVolume: this.audio?.masterGain?.gain.value || 0,
      voiceLevel: this.getMicLevel(),
      voiceControllers: this.livekit?.voices.size || 0,
      screens: this.livekit?.screens.length || 0,
    }
  }

  async destroyInternal() {
    this.audio = null
    this.livekit = null
    this.degraded = true
    this.status = {
      audioReady: false,
      voiceChatReady: false,
      micActive: false,
      screenshareActive: false,
    }
  }
}
