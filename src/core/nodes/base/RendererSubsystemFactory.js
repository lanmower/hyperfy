/* Renderer subsystem factory pattern for UI, Video, Image nodes */
import { UIRenderer } from '../ui/UIRenderer.js'
import { VideoRenderer } from '../video/VideoRenderer.js'
import { ImageRenderer } from '../image/ImageRenderer.js'

export class RendererSubsystemFactory {
  static createUIRenderer(node) {
    return new UIRenderer(node)
  }

  static createVideoRenderer(node) {
    return new VideoRenderer(node)
  }

  static createImageRenderer(node) {
    return new ImageRenderer(node)
  }

  static createByType(type, node) {
    const factories = {
      ui: () => this.createUIRenderer(node),
      video: () => this.createVideoRenderer(node),
      image: () => this.createImageRenderer(node),
    }
    const factory = factories[type]
    if (!factory) throw new Error(`[RendererSubsystemFactory] Unknown renderer type: ${type}`)
    return factory()
  }
}
