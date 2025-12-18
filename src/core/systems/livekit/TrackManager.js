import { EVENT } from '../../constants/EventNames.js'

export class TrackManager {
  constructor(clientLiveKit) {
    this.clientLiveKit = clientLiveKit
  }

  onTrackMuted(track) {
    if (track.isLocal && track.source === 'microphone') {
      this.clientLiveKit.status.mic = false
      this.clientLiveKit.events.emit(EVENT.livekit, this.clientLiveKit.status)
    }
  }

  onTrackUnmuted(track) {
    if (track.isLocal && track.source === 'microphone') {
      this.clientLiveKit.status.mic = true
      this.clientLiveKit.events.emit(EVENT.livekit, this.clientLiveKit.status)
    }
  }

  onLocalTrackPublished(publication) {
    const track = publication.track
    const playerId = this.clientLiveKit.network.id
    if (publication.source === 'microphone') {
      this.clientLiveKit.status.mic = true
      this.clientLiveKit.events.emit(EVENT.livekit, this.clientLiveKit.status)
    }
    if (publication.source === 'screen_share') {
      const metadata = JSON.parse(this.clientLiveKit.room.localParticipant.metadata || '{}')
      const targetId = metadata.screenTargetId
      this.clientLiveKit.status.screenshare = targetId
      const screen = this.clientLiveKit.screenManager.createPlayerScreen({ playerId, targetId, track, publication })
      this.clientLiveKit.screenManager.addScreen(screen)
      this.clientLiveKit.events.emit(EVENT.livekit, this.clientLiveKit.status)
    }
  }

  onLocalTrackUnpublished(publication) {
    const playerId = this.clientLiveKit.network.id
    if (publication.source === 'microphone') {
      this.clientLiveKit.status.mic = false
      this.clientLiveKit.events.emit(EVENT.livekit, this.clientLiveKit.status)
    }
    if (publication.source === 'screen_share') {
      const screen = this.clientLiveKit.screenManager.screens.find(s => s.playerId === playerId)
      this.clientLiveKit.screenManager.removeScreen(screen)
      this.clientLiveKit.status.screenshare = null
      this.clientLiveKit.events.emit(EVENT.livekit, this.clientLiveKit.status)
    }
  }

  onTrackSubscribed(track, publication, participant) {
    const playerId = participant.identity
    const player = this.clientLiveKit.entities.getPlayer(playerId)
    if (!player) return console.error('onTrackSubscribed failed: no player')
    if (track.source === 'microphone') {
      const level = this.clientLiveKit.levels[playerId] || this.clientLiveKit.defaultLevel
      const muted = this.clientLiveKit.muted.has(playerId)
      this.clientLiveKit.voiceController.create(player, level, muted, track, participant)
    }
    if (track.source === 'screen_share') {
      const metadata = JSON.parse(participant.metadata || '{}')
      const targetId = metadata.screenTargetId
      const screen = this.clientLiveKit.screenManager.createPlayerScreen({ playerId, targetId, track, publication })
      this.clientLiveKit.screenManager.addScreen(screen)
    }
  }

  onTrackUnsubscribed(track, publication, participant) {
    const playerId = participant.identity
    if (track.source === 'microphone') {
      const voice = this.clientLiveKit.voices.get(playerId)
      voice?.destroy()
      this.clientLiveKit.voices.delete(playerId)
    }
    if (track.source === 'screen_share') {
      const screen = this.clientLiveKit.screenManager.screens.find(s => s.playerId === playerId)
      this.clientLiveKit.screenManager.removeScreen(screen)
    }
  }
}
