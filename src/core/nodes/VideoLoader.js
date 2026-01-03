import { VideoInstanceManager } from './video/VideoInstanceManager.js'

export class VideoLoaderController {
  constructor(video) {
    this.video = video
    this.instanceManager = new VideoInstanceManager(video)
  }

  async loadInstance(n) {
    return this.instanceManager.loadInstance(n)
  }

  cleanup() {
    this.instanceManager.cleanup()
  }

  async prepareInstance(instance) {
    if (!instance) return null
    await instance.prepare
    return instance
  }

  configureInstance(instance, loop) {
    if (instance) {
      instance.loop = loop
    }
  }

  shouldPlayOnReady() {
    const video = this.video
    if (video.instance && !video.instance.isPlaying && video.shouldPlay) {
      video.instance.play()
      video.shouldPlay = false
      return true
    }
    return false
  }
}
