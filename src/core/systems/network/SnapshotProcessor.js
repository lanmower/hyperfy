import { emoteUrls } from '../../extras/playerEmotes.js'
import { storage } from '../../storage.js'

export class SnapshotProcessor {
  constructor(network) {
    this.network = network
  }

  process(data) {
    this.network.id = data.id
    this.network.serverTimeOffset = data.serverTime - performance.now()
    this.network.apiUrl = data.apiUrl
    this.network.maxUploadSize = data.maxUploadSize
    this.network.assetsUrl = data.assetsUrl

    this.preloadAssets(data)
    this.deserializeState(data)
    storage.set('authToken', data.authToken)
  }

  preloadAssets(data) {
    if (data.settings.avatar) {
      this.network.loader.preload('avatar', data.settings.avatar.url)
    }

    for (const item of data.blueprints) {
      if (item.preload && !item.disabled) {
        if (item.model) {
          const type = item.model.endsWith('.vrm') ? 'avatar' : 'model'
          this.network.loader.preload(type, item.model)
        }
        if (item.script) {
          this.network.loader.preload('script', item.script)
        }
        for (const value of Object.values(item.props || {})) {
          if (value === undefined || value === null || !value?.url || !value?.type) continue
          this.network.loader.preload(value.type, value.url)
        }
      }
    }

    for (const url of emoteUrls) {
      this.network.loader.preload('emote', url)
    }

    for (const item of data.entities) {
      if (item.type === 'player' && item.userId === this.network.id) {
        const url = item.sessionAvatar || item.avatar
        this.network.loader.preload('avatar', url)
      }
    }

    this.network.loader.execPreload()
  }

  deserializeState(data) {
    this.network.collections.deserialize(data.collections)
    this.network.settings.deserialize(data.settings)
    this.network.settings.setHasAdminCode(data.hasAdminCode)
    this.network.chat.deserialize(data.chat)
    this.network.blueprints.deserialize(data.blueprints)
    this.network.entities.deserialize(data.entities)
    this.network.livekit?.deserialize(data.livekit)
  }
}
