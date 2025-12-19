import { System } from './System.js'
import { isBoolean } from 'lodash-es'
import { Room, RoomEvent, ParticipantEvent, ScreenSharePresets } from 'livekit-client'
import { EVENT } from '../constants/EventNames.js'
import { TrackManager } from './livekit/TrackManager.js'
import { ScreenManager } from './livekit/ScreenManager.js'
import { VoiceController } from './livekit/VoiceController.js'

export class ClientLiveKit extends System {
  static DEPS = {
    settings: 'settings',
    events: 'events',
    network: 'network',
    audio: 'audio',
    livekit: 'livekit',
    entities: 'entities',
  }

  static EVENTS = {
    settingChanged: 'onSettingChanged',
  }

  constructor(world) {
    super(world)
    this.room = null
    this.status = {
      available: false,
      connected: false,
      mic: false,
      screenshare: null,
      level: null,
    }
    this.defaultLevel = null
    this.levels = {}
    this.muted = new Set()
    this.voices = new Map()
    this.trackManager = new TrackManager(this)
    this.screenManager = new ScreenManager(this)
    this.voiceController = new VoiceController(this)
  }

  start() {
    this.defaultLevel = this.settings.get('voice')
    this.status.level = this.defaultLevel
  }

  onSettingChanged = ({ key, value }) => {
    if (key === 'voice') {
      this.defaultLevel = value
      const myLevel = this.levels[this.network.id] || this.defaultLevel
      if (this.status.level !== myLevel) {
        this.status.level = myLevel
        this.events.emit(EVENT.livekit, this.status)
      }
      this.voices.forEach(voice => {
        const level = this.levels[voice.player.data.id] || this.defaultLevel
        voice.setLevel(level)
      })
    }
  }

  async deserialize(opts) {
    if (!opts) return
    this.status.available = true
    this.status.muted = opts.muted.has(this.network.id)
    this.levels = opts.levels
    this.muted = opts.muted
    this.room = new Room({
      webAudioMix: { audioContext: this.audio.ctx },
      publishDefaults: {
        screenShareEncoding: ScreenSharePresets.h1080fps30.encoding,
        screenShareSimulcastLayers: [ScreenSharePresets.h1080fps30],
      },
    })
    this.room.on(RoomEvent.TrackMuted, track => this.trackManager.onTrackMuted(track))
    this.room.on(RoomEvent.TrackUnmuted, track => this.trackManager.onTrackUnmuted(track))
    this.room.on(RoomEvent.LocalTrackPublished, pub => this.trackManager.onLocalTrackPublished(pub))
    this.room.on(RoomEvent.LocalTrackUnpublished, pub => this.trackManager.onLocalTrackUnpublished(pub))
    this.room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => this.trackManager.onTrackSubscribed(track, pub, participant))
    this.room.on(RoomEvent.TrackUnsubscribed, (track, pub, participant) => this.trackManager.onTrackUnsubscribed(track, pub, participant))
    this.room.localParticipant.on(ParticipantEvent.IsSpeakingChanged, speaking => {
      const player = this.entities.player
      this.events.emit(EVENT.speaking, { playerId: player.data.id, speaking })
      player.setSpeaking(speaking)
    })
    this.audio.ready(async () => {
      await this.room.connect(opts.wsUrl, opts.token)
      this.status.connected = true
      this.events.emit(EVENT.livekit, this.status)
    })
  }

  createVoiceController(player, level, muted, track, participant) {
    this.voiceController.create(player, level, muted, track, participant)
  }


  setMuted(playerId, muted) {
    if (muted && this.muted.has(playerId)) return
    if (!muted && !this.muted.has(playerId)) return
    if (muted) {
      this.muted.add(playerId)
    } else {
      this.muted.delete(playerId)
    }
    const voice = this.voices.get(playerId)
    voice?.setMuted(muted)
    this.events.emit('playerMuted', { playerId, muted })
    if (playerId === this.network.id) {
      this.status.muted = muted
      this.events.emit(EVENT.livekit, this.status)
    }
  }

  isMuted(playerId) {
    return this.muted.has(playerId)
  }

  setLevel(playerId, level) {
    this.levels[playerId] = level
    level = level || this.defaultLevel
    if (playerId === this.network.id) {
      if (this.status.level !== level) {
        this.status.level = level
        this.events.emit(EVENT.livekit, this.status)
      }
      return
    }
    const voice = this.voices.get(playerId)
    voice?.setLevel(level)
  }

  lateUpdate(delta) {
    this.voices.forEach(voice => {
      voice.lateUpdate(delta)
    })
  }

  setMicrophoneEnabled(value) {
    if (!this.room) return console.error('[livekit] setMicrophoneEnabled failed (not connected)')
    value = isBoolean(value) ? value : !this.room.localParticipant.isMicrophoneEnabled
    if (this.status.mic === value) return
    this.room.localParticipant.setMicrophoneEnabled(value)
  }

  setScreenShareTarget(targetId = null) {
    this.screenManager.setScreenShareTarget(targetId)
  }

  registerScreenNode(node) {
    return this.screenManager.registerScreenNode(node)
  }

  unregisterScreenNode(node) {
    this.screenManager.unregisterScreenNode(node)
  }

  destroy() {
    this.screenManager.destroy()
  }
}
