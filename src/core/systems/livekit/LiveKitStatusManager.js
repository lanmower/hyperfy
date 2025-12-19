import { EVENT } from '../../constants/EventNames.js'

export class LiveKitStatusManager {
  constructor(parent) {
    this.parent = parent
  }

  setMuted(playerId, muted) {
    if (muted && this.parent.muted.has(playerId)) return
    if (!muted && !this.parent.muted.has(playerId)) return
    if (muted) {
      this.parent.muted.add(playerId)
    } else {
      this.parent.muted.delete(playerId)
    }
    const voice = this.parent.voices.get(playerId)
    voice?.setMuted(muted)
    this.parent.events.emit('playerMuted', { playerId, muted })
    if (playerId === this.parent.network.id) {
      this.parent.status.muted = muted
      this.parent.events.emit(EVENT.livekit, this.parent.status)
    }
  }

  setLevel(playerId, level) {
    this.parent.levels[playerId] = level
    level = level || this.parent.defaultLevel
    if (playerId === this.parent.network.id) {
      if (this.parent.status.level !== level) {
        this.parent.status.level = level
        this.parent.events.emit(EVENT.livekit, this.parent.status)
      }
      return
    }
    const voice = this.parent.voices.get(playerId)
    voice?.setLevel(level)
  }

  handleSettingChanged(key, value) {
    if (key === 'voice') {
      this.parent.defaultLevel = value
      const myLevel = this.parent.levels[this.parent.network.id] || this.parent.defaultLevel
      if (this.parent.status.level !== myLevel) {
        this.parent.status.level = myLevel
        this.parent.events.emit(EVENT.livekit, this.parent.status)
      }
      this.parent.voices.forEach(voice => {
        const level = this.parent.levels[voice.player.data.id] || this.parent.defaultLevel
        voice.setLevel(level)
      })
    }
  }
}
