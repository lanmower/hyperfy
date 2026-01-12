// Avatar factory with VRM and emote creation
import { createVRMFactory } from './createVRMFactory.js'
import { createEmoteFactory } from './createEmoteFactory.js'
import { BaseFactory } from '../../patterns/BaseFactory.js'

export class AvatarFactory extends BaseFactory {
  static create(config) {
    this.validate(config)
    const { type = 'vrm', glb, setupMaterial } = config

    if (type === 'vrm') {
      return createVRMFactory(glb, setupMaterial)
    } else if (type === 'emote') {
      return createEmoteFactory(glb, setupMaterial)
    }

    throw new Error(`Unknown avatar type: ${type}`)
  }

  static validate(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('AvatarFactory config must be an object')
    }
    if (!config.glb) {
      throw new Error('AvatarFactory config requires glb data')
    }
  }

  static createVRM(glb, setupMaterial) {
    return this.create({ type: 'vrm', glb, setupMaterial })
  }

  static createEmote(glb, setupMaterial) {
    return this.create({ type: 'emote', glb, setupMaterial })
  }
}
