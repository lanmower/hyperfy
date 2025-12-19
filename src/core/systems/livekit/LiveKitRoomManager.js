import { Room, RoomEvent, ParticipantEvent, ScreenSharePresets } from 'livekit-client'
import { EVENT } from '../../constants/EventNames.js'

export class LiveKitRoomManager {
  constructor(parent) {
    this.parent = parent
  }

  async setup(opts) {
    const room = new Room({
      webAudioMix: { audioContext: this.parent.audio.ctx },
      publishDefaults: {
        screenShareEncoding: ScreenSharePresets.h1080fps30.encoding,
        screenShareSimulcastLayers: [ScreenSharePresets.h1080fps30],
      },
    })
    room.on(RoomEvent.TrackMuted, track => this.parent.trackManager.onTrackMuted(track))
    room.on(RoomEvent.TrackUnmuted, track => this.parent.trackManager.onTrackUnmuted(track))
    room.on(RoomEvent.LocalTrackPublished, pub => this.parent.trackManager.onLocalTrackPublished(pub))
    room.on(RoomEvent.LocalTrackUnpublished, pub => this.parent.trackManager.onLocalTrackUnpublished(pub))
    room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => this.parent.trackManager.onTrackSubscribed(track, pub, participant))
    room.on(RoomEvent.TrackUnsubscribed, (track, pub, participant) => this.parent.trackManager.onTrackUnsubscribed(track, pub, participant))
    room.localParticipant.on(ParticipantEvent.IsSpeakingChanged, speaking => {
      const player = this.parent.entities.player
      this.parent.events.emit(EVENT.speaking, { playerId: player.data.id, speaking })
      player.setSpeaking(speaking)
    })
    await this.parent.audio.ready(async () => {
      await room.connect(opts.wsUrl, opts.token)
      this.parent.status.connected = true
      this.parent.events.emit(EVENT.livekit, this.parent.status)
    })
    return room
  }
}
