import { VideoAudioController } from './video/VideoAudioController.js'
import { VideoRenderer } from './video/VideoRenderer.js'

export class VideoPlaybackController {
  constructor(video) {
    this.video = video
    this.renderer = new VideoRenderer(video)
    this.audioController = new VideoAudioController(video)
  }

  play(restartIfPlaying) {
    if (this.video.instance) {
      this.video.instance.play(restartIfPlaying)
    } else {
      this.video.shouldPlay = true
    }
  }

  pause() { this.video.instance?.pause() }
  stop() { this.video.instance?.stop() }
  getDuration() { return this.video.instance ? this.video.instance.duration : 0 }
  isPlaying() { return this.video.instance ? this.video.instance.isPlaying : false }
  getTime() { return this.video.instance ? this.video.instance.currentTime : 0 }
  setTime(value) { if (this.video.instance) this.video.instance.currentTime = value }
  updatePannerPosition() { this.audioController.updatePannerPosition() }
  cleanup() { if (this.video.instance) this.audioController.cleanup() }
}
