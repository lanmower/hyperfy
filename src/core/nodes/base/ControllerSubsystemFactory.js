/* Controller/Manager subsystem factory for Video, UI, Nametag nodes */
import { VideoInstanceManager } from '../video/VideoInstanceManager.js'
import { VideoAudioController } from '../video/VideoAudioController.js'
import { UILayoutManager } from '../ui/UILayoutManager.js'
import { UIBillboardController } from '../ui/UIBillboardController.js'

export class ControllerSubsystemFactory {
  static createVideoInstanceManager(node) {
    return new VideoInstanceManager(node)
  }

  static createVideoAudioController(node) {
    return new VideoAudioController(node)
  }

  static createUILayoutManager(node) {
    return new UILayoutManager(node)
  }

  static createUIBillboardController(node) {
    return new UIBillboardController(node)
  }

  static initializeVideoSubsystems(node) {
    node.n = 0
    node._loading = true
    node.instance = null
    node.shouldPlay = false
    node.renderer = new (require('../video/VideoRenderer.js')).VideoRenderer(node)
    node.audioController = this.createVideoAudioController(node)
    node.instanceManager = this.createVideoInstanceManager(node)
    return node
  }

  static initializeUISubsystems(node) {
    node.renderer = new (require('../ui/UIRenderer.js')).UIRenderer(node)
    node.layoutManager = this.createUILayoutManager(node)
    node.billboardController = this.createUIBillboardController(node)
    return node
  }

  static cleanupVideoSubsystems(node) {
    node.audioController?.cleanup?.()
    node.instanceManager?.cleanup?.()
    node.instance = null
  }
}
