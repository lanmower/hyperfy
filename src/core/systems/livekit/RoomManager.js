import { Room, RoomEvent, ParticipantEvent, ScreenSharePresets } from 'livekit-client'
import { EVENT } from '../../constants/EventNames.js'

export class RoomManager {
  constructor(livekit) {
    this.livekit = livekit
  }

  async deserialize(opts, audio) {
    if (!opts) return
    const livekit = this.livekit
    livekit.status.available = true
    livekit.status.muted = opts.muted.has(livekit.network.id)
    livekit.levels = opts.levels
    livekit.muted = opts.muted
    livekit.room = new Room({
      webAudioMix: {
        audioContext: audio.ctx,
      },
      publishDefaults: {
        screenShareEncoding: ScreenSharePresets.h1080fps30.encoding,
        screenShareSimulcastLayers: [ScreenSharePresets.h1080fps30],
      },
    })
    livekit.room.on(RoomEvent.TrackMuted, track => this.livekit.trackManager.onTrackMuted(track))
    livekit.room.on(RoomEvent.TrackUnmuted, track => this.livekit.trackManager.onTrackUnmuted(track))
    livekit.room.on(RoomEvent.LocalTrackPublished, pub => this.livekit.trackManager.onLocalTrackPublished(pub))
    livekit.room.on(RoomEvent.LocalTrackUnpublished, pub => this.livekit.trackManager.onLocalTrackUnpublished(pub))
    livekit.room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => this.livekit.trackManager.onTrackSubscribed(track, pub, participant))
    livekit.room.on(RoomEvent.TrackUnsubscribed, (track, pub, participant) => this.livekit.trackManager.onTrackUnsubscribed(track, pub, participant))
    livekit.room.localParticipant.on(ParticipantEvent.IsSpeakingChanged, speaking => {
      const player = livekit.entities.player
      livekit.events.emit(EVENT.speaking, { playerId: player.data.id, speaking })
      player.setSpeaking(speaking)
    })
    audio.ready(async () => {
      await livekit.room.connect(opts.wsUrl, opts.token)
      livekit.status.connected = true
      livekit.events.emit(EVENT.livekit, livekit.status)
    })
  }

  setScreenShareTarget(targetId = null) {
    const livekit = this.livekit
    if (!livekit.room) return console.error('[livekit] setScreenShareTarget failed (not connected)')
    if (livekit.status.screenshare === targetId) return
    const metadata = JSON.stringify({
      screenTargetId: targetId,
    })
    livekit.room.localParticipant.setMetadata(metadata)
    livekit.room.localParticipant.setScreenShareEnabled(!!targetId, {
    })
  }

  setMicrophoneEnabled(value) {
    const livekit = this.livekit
    if (!livekit.room) return console.error('[livekit] setMicrophoneEnabled failed (not connected)')
    const { isBoolean } = require('lodash-es')
    value = isBoolean(value) ? value : !livekit.room.localParticipant.isMicrophoneEnabled
    if (livekit.status.mic === value) return
    livekit.room.localParticipant.setMicrophoneEnabled(value)
  }

  destroy() {
    const livekit = this.livekit
    livekit.voices.forEach(voice => {
      voice.destroy()
    })
    livekit.voices.clear()
    livekit.screenManager.destroyAll()
    if (livekit.room) {
      livekit.room.off(RoomEvent.TrackMuted, track => this.onTrackMuted(track))
      livekit.room.off(RoomEvent.TrackUnmuted, track => this.onTrackUnmuted(track))
      livekit.room.off(RoomEvent.LocalTrackPublished, pub => this.onLocalTrackPublished(pub))
      livekit.room.off(RoomEvent.LocalTrackUnpublished, pub => this.onLocalTrackUnpublished(pub))
      livekit.room.off(RoomEvent.TrackSubscribed, (track, pub, participant) => this.onTrackSubscribed(track, pub, participant))
      livekit.room.off(RoomEvent.TrackUnsubscribed, (track, pub, participant) => this.onTrackUnsubscribed(track, pub, participant))
      if (livekit.room.localParticipant) {
        livekit.room.localParticipant.off(ParticipantEvent.IsSpeakingChanged)
      }
      livekit.room?.disconnect()
    }
  }
}
