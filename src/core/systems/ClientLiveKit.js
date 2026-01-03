import * as THREE from '../extras/three.js'
import { System } from './System.js'
import { EVENT } from '../constants/EventNames.js'
import { StructuredLogger } from '../utils/logging/index.js'
import { ClientLiveKitConnection } from './ClientLiveKitConnection.js'
import { ClientLiveKitParticipants } from './ClientLiveKitParticipants.js'

const logger = new StructuredLogger('ClientLiveKit')

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
    this.screens = []
    this.screenNodes = new Set()
    this.degraded = false
    this.connection = new ClientLiveKitConnection(this)
    this.participants = new ClientLiveKitParticipants(this)
  }

  start() {
    const capabilities = this.world.capabilities
    if (capabilities && !capabilities.canUseVoiceChat) {
      logger.warn('Voice chat unavailable - audio/video disabled', {})
      this.degraded = true
      this.status.available = false
      return
    }
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
    this.status.muted = opts?.muted.has(this.network.id) || false
    this.levels = opts?.levels || {}
    this.muted = opts?.muted || new Set()
    await this.connection.connect(opts, this.audio)
  }

  createVoiceController(player, level, muted, track, participant) {
    this.participants.createVoiceController(player, level, muted, track, participant)
  }

  createPlayerScreen({ playerId, targetId, track, publication }) {
    const elem = document.createElement('video')
    elem.playsInline = true
    elem.muted = true
    track.attach(elem)
    const texture = new THREE.VideoTexture(elem)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.anisotropy = this.world.graphics.maxAnisotropy
    texture.needsUpdate = true
    return { playerId, targetId, track, publication, texture, elem }
  }

  markScreenNodesDirty(targetId) {
    for (const node of this.screenNodes) {
      if (node._screenId === targetId) {
        node.needsRebuild = true
        node.setDirty()
      }
    }
  }

  addScreen(screen) {
    this.screens.push(screen)
    this.markScreenNodesDirty(screen.targetId)
  }

  removeScreen(screen) {
    screen.destroy()
    this.screens = this.screens.filter(s => s !== screen)
    this.markScreenNodesDirty(screen.targetId)
  }

  setMuted(playerId, muted) {
    this.participants.setMuted(playerId, muted)
  }

  isMuted(playerId) {
    return this.participants.isMuted(playerId)
  }

  setLevel(playerId, level) {
    this.participants.setLevel(playerId, level)
  }

  lateUpdate(delta) {
    this.participants.updateSpatial(delta)
  }

  setMicrophoneEnabled(value) {
    this.connection.setMicrophoneEnabled(value)
  }

  setScreenShareTarget(targetId = null) {
    this.connection.setScreenShareTarget(targetId)
  }

  registerScreenNode(node) {
    this.screenNodes.add(node)
    let match
    for (const screen of this.screens) {
      if (screen.targetId === node._screenId) {
        match = screen
      }
    }
    return match
  }

  unregisterScreenNode(node) {
    this.screenNodes.delete(node)
  }

  destroy() {
    this.connection.destroy()
    this.participants.destroy()
    this.screens.forEach(screen => screen.destroy())
    this.screens = []
    this.screenNodes.clear()
  }
}
