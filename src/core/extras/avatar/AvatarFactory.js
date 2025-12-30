/* Unified avatar factory consolidating VRM and emote creation */

import { createVRMFactory } from './createVRMFactory.js'
import { createEmoteFactory } from './createEmoteFactory.js'

export class AvatarFactory {
  static createVRM(glb, setupMaterial) {
    return createVRMFactory(glb, setupMaterial)
  }

  static createEmote(glb, setupMaterial) {
    return createEmoteFactory(glb, setupMaterial)
  }

  static create(type, glb, setupMaterial) {
    if (type === 'vrm') {
      return this.createVRM(glb, setupMaterial)
    } else if (type === 'emote') {
      return this.createEmote(glb, setupMaterial)
    }
    throw new Error(`Unknown avatar type: ${type}`)
  }
}
