import { Room, RoomEvent, ParticipantEvent, ScreenSharePresets } from 'livekit-client'
import { EVENT } from '../constants/EventNames.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('ClientLiveKitConnection')

export class ClientLiveKitConnection {
  constructor(clientLiveKit) {
    this.clientLiveKit = clientLiveKit
    this.room = null
  }

  async connect(opts, audio) {
    if (!opts) return
    this.clientLiveKit.status.available = true
    const room = new Room({
      webAudioMix: { audioContext: audio.ctx },
      publishDefaults: {
        screenShareEncoding: ScreenSharePresets.h1080fps30.encoding,
        screenShareSimulcastLayers: [ScreenSharePresets.h1080fps30],
      },
    })
    this.setupTrackHandlers(room, audio)
    this.setupParticipantHandlers(room)
    await audio.ready(async () => {
      await room.connect(opts.wsUrl, opts.token)
      this.clientLiveKit.status.connected = true
      this.clientLiveKit.events.emit(EVENT.livekit, this.clientLiveKit.status)
    })
    this.room = room
  }

  setupTrackHandlers(room, audio) {
    const handleMicStatus = (track, isMuted) => {
      if (track.isLocal && track.source === 'microphone') {
        this.clientLiveKit.status.mic = !isMuted
        this.clientLiveKit.events.emit(EVENT.livekit, this.clientLiveKit.status)
      }
    }
    room.on(RoomEvent.TrackMuted, track => handleMicStatus(track, true))
    room.on(RoomEvent.TrackUnmuted, track => handleMicStatus(track, false))

    const handleLocalTrack = (pub, isPublish) => {
      if (pub.source === 'microphone') {
        this.clientLiveKit.status.mic = isPublish
        this.clientLiveKit.events.emit(EVENT.livekit, this.clientLiveKit.status)
      } else if (pub.source === 'screen_share') {
        if (isPublish) {
          let metadata = {}
          try {
            metadata = JSON.parse(room.localParticipant.metadata || '{}')
          } catch (parseErr) {
            logger.warn('Failed to parse local participant metadata', { error: parseErr.message })
          }
          const targetId = metadata.screenTargetId
          this.clientLiveKit.status.screenshare = targetId
          const screen = this.clientLiveKit.createPlayerScreen({ playerId: this.clientLiveKit.network.id, targetId, track: pub.track, publication: pub })
          this.clientLiveKit.addScreen(screen)
        } else {
          const screen = this.clientLiveKit.screens.find(s => s.playerId === this.clientLiveKit.network.id)
          this.clientLiveKit.removeScreen(screen)
          this.clientLiveKit.status.screenshare = null
        }
        this.clientLiveKit.events.emit(EVENT.livekit, this.clientLiveKit.status)
      }
    }
    room.on(RoomEvent.LocalTrackPublished, pub => handleLocalTrack(pub, true))
    room.on(RoomEvent.LocalTrackUnpublished, pub => handleLocalTrack(pub, false))
  }

  setupParticipantHandlers(room) {
    room.on(RoomEvent.TrackSubscribed, (track, pub, participant) =>
      this.handleRemoteTrack(track, pub, participant, true)
    )
    room.on(RoomEvent.TrackUnsubscribed, (track, pub, participant) =>
      this.handleRemoteTrack(track, pub, participant, false)
    )
    room.localParticipant.on(ParticipantEvent.IsSpeakingChanged, speaking => {
      const player = this.clientLiveKit.entities.player
      this.clientLiveKit.events.emit(EVENT.speaking, { playerId: player.data.id, speaking })
      player.setSpeaking(speaking)
    })
  }

  handleRemoteTrack(track, pub, participant, isSubscribe) {
    const playerId = participant.identity
    if (track.source === 'microphone') {
      if (isSubscribe) {
        const player = this.clientLiveKit.entities.getPlayer(playerId)
        if (!player) return logger.error('Failed to subscribe to track', { playerId, reason: 'player not found' })
        const level = this.clientLiveKit.levels[playerId] || this.clientLiveKit.defaultLevel
        const muted = this.clientLiveKit.muted.has(playerId)
        this.clientLiveKit.createVoiceController(player, level, muted, track, participant)
      } else {
        this.clientLiveKit.voices.get(playerId)?.destroy()
        this.clientLiveKit.voices.delete(playerId)
      }
    } else if (track.source === 'screen_share') {
      if (isSubscribe) {
        let metadata = {}
        try {
          metadata = JSON.parse(participant.metadata || '{}')
        } catch (parseErr) {
          logger.warn('Failed to parse participant metadata', { playerId, error: parseErr.message })
        }
        const targetId = metadata.screenTargetId
        const screen = this.clientLiveKit.createPlayerScreen({ playerId, targetId, track, publication: pub })
        this.clientLiveKit.addScreen(screen)
      } else {
        const screen = this.clientLiveKit.screens.find(s => s.playerId === playerId)
        this.clientLiveKit.removeScreen(screen)
      }
    }
  }

  setMicrophoneEnabled(value) {
    if (!this.room) return logger.error('setMicrophoneEnabled failed', { reason: 'not connected' })
    value = typeof value === 'boolean' ? value : !this.room.localParticipant.isMicrophoneEnabled
    if (this.clientLiveKit.status.mic === value) return
    this.room.localParticipant.setMicrophoneEnabled(value)
  }

  setScreenShareTarget(targetId = null) {
    if (!this.room) return logger.error('setScreenShareTarget failed', { reason: 'not connected' })
    if (this.clientLiveKit.status.screenshare === targetId) return
    const metadata = JSON.stringify({ screenTargetId: targetId })
    this.room.localParticipant.setMetadata(metadata)
    this.room.localParticipant.setScreenShareEnabled(!!targetId, {})
  }

  destroy() {
    if (this.room) {
      this.room.disconnect()
      this.room = null
    }
  }
}
