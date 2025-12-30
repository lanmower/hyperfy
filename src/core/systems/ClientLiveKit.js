import * as THREE from '../extras/three.js'
import { System } from './System.js'
import { isBoolean } from 'lodash-es'
import { Room, RoomEvent, ParticipantEvent, ScreenSharePresets } from 'livekit-client'
import { EVENT } from '../constants/EventNames.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'
import { SharedVectorPool } from '../utils/SharedVectorPool.js'

const logger = new ComponentLogger('ClientLiveKit')

const { v1, v2, q1 } = SharedVectorPool('ClientLiveKit', 2, 1)

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
    if (!opts) return
    this.status.available = true
    this.status.muted = opts.muted.has(this.network.id)
    this.levels = opts.levels
    this.muted = opts.muted
    const room = new Room({
      webAudioMix: { audioContext: this.audio.ctx },
      publishDefaults: {
        screenShareEncoding: ScreenSharePresets.h1080fps30.encoding,
        screenShareSimulcastLayers: [ScreenSharePresets.h1080fps30],
      },
    })
    const handleMicStatus = (track, isMuted) => {
      if (track.isLocal && track.source === 'microphone') {
        this.status.mic = !isMuted
        this.events.emit(EVENT.livekit, this.status)
      }
    }
    room.on(RoomEvent.TrackMuted, track => handleMicStatus(track, true))
    room.on(RoomEvent.TrackUnmuted, track => handleMicStatus(track, false))
    const handleLocalTrack = (pub, isPublish) => {
      if (pub.source === 'microphone') {
        this.status.mic = isPublish
        this.events.emit(EVENT.livekit, this.status)
      } else if (pub.source === 'screen_share') {
        if (isPublish) {
          const metadata = JSON.parse(room.localParticipant.metadata || '{}')
          const targetId = metadata.screenTargetId
          this.status.screenshare = targetId
          const screen = this.createPlayerScreen({ playerId: this.network.id, targetId, track: pub.track, publication: pub })
          this.addScreen(screen)
        } else {
          const screen = this.screens.find(s => s.playerId === this.network.id)
          this.removeScreen(screen)
          this.status.screenshare = null
        }
        this.events.emit(EVENT.livekit, this.status)
      }
    }
    room.on(RoomEvent.LocalTrackPublished, pub => handleLocalTrack(pub, true))
    room.on(RoomEvent.LocalTrackUnpublished, pub => handleLocalTrack(pub, false))
    const handleTrack = (track, pub, participant, isSubscribe) => {
      const playerId = participant.identity
      if (track.source === 'microphone') {
        if (isSubscribe) {
          const player = this.entities.getPlayer(playerId)
          if (!player) return logger.error('Failed to subscribe to track', { playerId, reason: 'player not found' })
          const level = this.levels[playerId] || this.defaultLevel
          const muted = this.muted.has(playerId)
          this.createVoiceController(player, level, muted, track, participant)
        } else {
          this.voices.get(playerId)?.destroy()
          this.voices.delete(playerId)
        }
      } else if (track.source === 'screen_share') {
        if (isSubscribe) {
          const metadata = JSON.parse(participant.metadata || '{}')
          const targetId = metadata.screenTargetId
          const screen = this.createPlayerScreen({ playerId, targetId, track, publication: pub })
          this.addScreen(screen)
        } else {
          const screen = this.screens.find(s => s.playerId === playerId)
          this.removeScreen(screen)
        }
      }
    }
    room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => handleTrack(track, pub, participant, true))
    room.on(RoomEvent.TrackUnsubscribed, (track, pub, participant) => handleTrack(track, pub, participant, false))
    room.localParticipant.on(ParticipantEvent.IsSpeakingChanged, speaking => {
      const player = this.entities.player
      this.events.emit(EVENT.speaking, { playerId: player.data.id, speaking })
      player.setSpeaking(speaking)
    })
    await this.audio.ready(async () => {
      await room.connect(opts.wsUrl, opts.token)
      this.status.connected = true
      this.events.emit(EVENT.livekit, this.status)
    })
    this.room = room
  }

  createVoiceController(player, level, muted, track, participant) {
    track.setAudioContext(this.audio.ctx)
    const root = this.audio.ctx.createGain()
    const panner = this.audio.ctx.createPanner()
    panner.panningModel = 'HRTF'
    panner.distanceModel = 'inverse'
    panner.refDistance = 1
    panner.maxDistance = 40
    panner.rolloffFactor = 3
    panner.coneInnerAngle = 360
    panner.coneOuterAngle = 360
    panner.coneOuterGain = 0
    const gain = this.audio.groupGains.voice
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
        const endTime = this.audio.ctx.currentTime + this.audio.lastDelta
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
    this.voices.set(player.data.id, {
      player, track, participant, root, panner, gain,
      get level() { return level },
      get muted() { return muted },
      setMuted: val => { if (muted !== val) { muted = val; applyAudioSettings() } },
      setLevel: val => { if (level !== val) { level = val; applyAudioSettings() } },
      lateUpdate: updateSpatialAudio,
      destroy: () => {
        this.events.emit(EVENT.speaking, { playerId: player.data.id, speaking: false })
        player.setSpeaking(false)
        track.detach()
      },
    })
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
    if (!this.room) return logger.error('setMicrophoneEnabled failed', { reason: 'not connected' })
    value = isBoolean(value) ? value : !this.room.localParticipant.isMicrophoneEnabled
    if (this.status.mic === value) return
    this.room.localParticipant.setMicrophoneEnabled(value)
  }

  setScreenShareTarget(targetId = null) {
    if (!this.room) return logger.error('setScreenShareTarget failed', { reason: 'not connected' })
    if (this.status.screenshare === targetId) return
    const metadata = JSON.stringify({ screenTargetId: targetId })
    this.room.localParticipant.setMetadata(metadata)
    this.room.localParticipant.setScreenShareEnabled(!!targetId, {})
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
    this.screens.forEach(screen => screen.destroy())
    this.screens = []
    this.screenNodes.clear()
  }
}
