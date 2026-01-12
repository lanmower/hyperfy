/* Audio subsystem factory pattern for Audio, Video, Nametag nodes */
import { AudioPlaybackController } from '../audio/AudioPlaybackController.js'
import { AudioPannerController } from '../audio/AudioPannerController.js'

export class AudioSubsystemFactory {
  static createPlayback(node) {
    return new AudioPlaybackController(node)
  }

  static createPanner(node) {
    return new AudioPannerController(node)
  }

  static initializeAudioNode(node) {
    node.playback = this.createPlayback(node)
    node.gainNode = null
    node.pannerNode = null
    node.source = null
    node.offset = 0
    node.shouldPlay = false
    node.startTime = null
    return node
  }

  static updatePannerPosition(node) {
    AudioPannerController.updatePannerPosition(node)
  }
}
