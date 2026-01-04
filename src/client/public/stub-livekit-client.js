export class Room {
  constructor(opts) {}
  connect(wsUrl, token) { return Promise.resolve(); }
  disconnect() { return Promise.resolve(); }
  on(event, handler) {}
  off(event, handler) {}
  get localParticipant() { return { metadata: '', setMetadata() {}, setScreenShareEnabled() {}, on() {} }; }
}

export class LocalAudioTrack {
  constructor() {}
}

export class LocalVideoTrack {
  constructor() {}
}

export class LocalParticipant {
  constructor() {}
  get isMicrophoneEnabled() { return false; }
  setMicrophoneEnabled(enabled) {}
  setMetadata(metadata) {}
  setScreenShareEnabled(enabled, opts) {}
  on(event, handler) {}
}

export class RemoteAudioTrack {
  constructor() {}
}

export class RemoteVideoTrack {
  constructor() {}
}

export class RemoteParticipant {
  constructor() {}
  get metadata() { return ''; }
  on(event, handler) {}
}

export class LocalTrackPublication {
  constructor() {}
}

export class RemoteTrackPublication {
  constructor() {}
}

export const RoomEvent = {
  TrackMuted: 'trackMuted',
  TrackUnmuted: 'trackUnmuted',
  LocalTrackPublished: 'localTrackPublished',
  LocalTrackUnpublished: 'localTrackUnpublished',
  TrackSubscribed: 'trackSubscribed',
  TrackUnsubscribed: 'trackUnsubscribed'
};

export const ParticipantEvent = {
  IsSpeakingChanged: 'isSpeakingChanged',
  TrackPublished: 'trackPublished',
  TrackSubscribed: 'trackSubscribed',
  TrackUnpublished: 'trackUnpublished',
  TrackUnsubscribed: 'trackUnsubscribed',
  TrackMuted: 'trackMuted',
  TrackUnmuted: 'trackUnmuted',
  LocalTrackPublished: 'localTrackPublished',
  LocalTrackUnpublished: 'localTrackUnpublished'
};

export const ScreenSharePresets = {
  h1080fps30: {
    encoding: {
      maxBitrate: 3000000,
      maxFramerate: 30
    }
  }
};

export default { Room, LocalAudioTrack, LocalVideoTrack, RoomEvent, ParticipantEvent, ScreenSharePresets };
