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
    this.statusManager.handleSettingChanged(key, value)
  }

  async deserialize(opts) {
    if (!opts) return
    this.status.available = true
    this.status.muted = opts.muted.has(this.network.id)
    this.levels = opts.levels
    this.muted = opts.muted
    this.room = await this.roomManager.setup(opts)
  }

  createVoiceController(player, level, muted, track, participant) {
    this.voiceController.create(player, level, muted, track, participant)
  }

  setMuted(playerId, muted) {
    this.statusManager.setMuted(playerId, muted)
  }

  isMuted(playerId) {
    return this.muted.has(playerId)
  }

  setLevel(playerId, level) {
    this.statusManager.setLevel(playerId, level)
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
