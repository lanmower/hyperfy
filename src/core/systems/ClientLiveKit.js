import { System } from './System.js'
import { isBoolean } from 'lodash-es'
import { PlayerVoiceController } from './livekit/PlayerVoiceController.js'
import { TrackManager } from './livekit/TrackManager.js'
import { ScreenManager } from './livekit/ScreenManager.js'
import { RoomManager } from './livekit/RoomManager.js'

export class ClientLiveKit extends System {
  static DEPS = {
    settings: 'settings',
    events: 'events',
    network: 'network',
    audio: 'audio',
    livekit: 'livekit',
    entities: 'entities',
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
    this.roomManager = new RoomManager(this)
  }

  get settings() { return this.getService(ClientLiveKit.DEPS.settings) }
  get events() { return this.getService(ClientLiveKit.DEPS.events) }
  get network() { return this.getService(ClientLiveKit.DEPS.network) }
  get audio() { return this.getService(ClientLiveKit.DEPS.audio) }
  get livekit() { return this.getService(ClientLiveKit.DEPS.livekit) }
  get entities() { return this.getService(ClientLiveKit.DEPS.entities) }

  start() {
    this.defaultLevel = this.settings.get('voice')
    this.status.level = this.defaultLevel
    this.events.on('settingChanged', this.onSettingChanged)
  }

  onSettingChanged = ({ key, value }) => {
    if (key === 'voice') {
      this.defaultLevel = value
      const myLevel = this.levels[this.network.id] || this.defaultLevel
      if (this.status.level !== myLevel) {
        this.status.level = myLevel
        this.events.emit('livekitStatusChanged', this.status)
      }
      this.voices.forEach(voice => {
        const level = this.levels[voice.player.data.id] || this.defaultLevel
        voice.setLevel(level)
      })
    }
  }

  async deserialize(opts) {
    return this.roomManager.deserialize(opts, this.audio)
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
      this.events.emit('livekitStatusChanged', this.status)
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
        this.events.emit('livekitStatusChanged', this.status)
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
    return this.roomManager.setMicrophoneEnabled(value)
  }

  setScreenShareTarget(targetId = null) {
    return this.roomManager.setScreenShareTarget(targetId)
  }

  registerScreenNode(node) {
    return this.screenManager.registerScreenNode(node)
  }

  unregisterScreenNode(node) {
    return this.screenManager.unregisterScreenNode(node)
  }

  destroy() {
    return this.roomManager.destroy()
  }
}
