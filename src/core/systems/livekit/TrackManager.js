import { PlayerVoiceController } from './PlayerVoiceController.js'
import { createPlayerScreen } from './ScreenManager.js'

export class TrackManager {
  constructor(livekit) {
    this.livekit = livekit
  }

  onTrackMuted(track) {
    if (track.isLocal && track.source === 'microphone') {
      this.livekit.status.mic = false
      this.livekit.events.emit('livekitStatusChanged', this.livekit.status)
    }
  }

  onTrackUnmuted(track) {
    if (track.isLocal && track.source === 'microphone') {
      this.livekit.status.mic = true
      this.livekit.events.emit('livekitStatusChanged', this.livekit.status)
    }
  }

  onLocalTrackPublished(publication) {
    const livekit = this.livekit
    const world = livekit.world
    const track = publication.track
    const playerId = livekit.network.id
    if (publication.source === 'microphone') {
      livekit.status.mic = true
      livekit.events.emit('livekitStatusChanged', livekit.status)
    }
    if (publication.source === 'screen_share') {
      const metadata = JSON.parse(livekit.room.localParticipant.metadata || '{}')
      const targetId = metadata.screenTargetId
      livekit.status.screenshare = targetId
      const screen = createPlayerScreen({ world, playerId, targetId, track, publication })
      livekit.screenManager.addScreen(screen)
      livekit.events.emit('livekitStatusChanged', livekit.status)
    }
  }

  onLocalTrackUnpublished(publication) {
    const livekit = this.livekit
    const playerId = livekit.network.id
    if (publication.source === 'microphone') {
      livekit.status.mic = false
      livekit.events.emit('livekitStatusChanged', livekit.status)
    }
    if (publication.source === 'screen_share') {
      const screen = livekit.screenManager.screens.find(s => s.playerId === playerId)
      livekit.screenManager.removeScreen(screen)
      livekit.status.screenshare = null
      livekit.events.emit('livekitStatusChanged', livekit.status)
    }
  }

  onTrackSubscribed(track, publication, participant) {
    const livekit = this.livekit
    const playerId = participant.identity
    const player = livekit.entities.getPlayer(playerId)
    if (!player) return console.error('onTrackSubscribed failed: no player')
    const world = livekit.world
    if (track.source === 'microphone') {
      const level = livekit.levels[playerId] || livekit.defaultLevel
      const muted = livekit.muted.has(playerId)
      const voice = new PlayerVoiceController(world, player, level, muted, track, participant, livekit)
      livekit.voices.set(playerId, voice)
    }
    if (track.source === 'screen_share') {
      const metadata = JSON.parse(participant.metadata || '{}')
      const targetId = metadata.screenTargetId
      const screen = createPlayerScreen({ world, playerId, targetId, track, publication })
      livekit.screenManager.addScreen(screen)
    }
  }

  onTrackUnsubscribed(track, publication, participant) {
    const livekit = this.livekit
    const playerId = participant.identity
    if (track.source === 'microphone') {
      const voice = livekit.voices.get(playerId)
      voice?.destroy()
      livekit.voices.delete(playerId)
    }
    if (track.source === 'screen_share') {
      const screen = livekit.screenManager.screens.find(s => s.playerId === playerId)
      livekit.screenManager.removeScreen(screen)
    }
  }
}
