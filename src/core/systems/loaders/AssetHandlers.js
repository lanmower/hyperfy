import { BaseAssetHandler } from './BaseAssetHandler.js'
import { AssetHandlerRegistry } from './AssetHandlerRegistry.js'
import { AssetHandlerTypes } from './AssetHandlerTypes.js'
import { StructuredLogger } from '../../utils/logging/index.js'
import { createVideoFactory } from './VideoFactory.js'
import { glbToNodes } from '../../extras/glbToNodes.js'
import { AssetResults } from './AssetResults.js'

const logger = new StructuredLogger('AssetHandlers')

export class AssetHandlers extends BaseAssetHandler {
   constructor(clientLoader, world) {
     super()
     this.clientLoader = clientLoader
     this.world = world
     this.results = clientLoader.results
     this.types = new AssetHandlerTypes(clientLoader, world)
     this.insertRegistry = new AssetHandlerRegistry()
     // Initialize handlers immediately in constructor
     this.setupHandlers()
   }

  setupHandlers() {
    this.registry.register('video', (url, file, key) => this.types.handleVideo(url, file, key))
    this.registry.register('hdr', (url, file, key) => this.types.handleHDR(url, file, key))
    this.registry.register('image', (url, file, key) => this.types.handleImage(url, file, key))
    this.registry.register('texture', (url, file, key) => this.types.handleTexture(url, file, key))
    this.registry.register('model', (url, file, key) => this.types.handleModel(url, file, key))
    this.registry.register('emote', (url, file, key) => this.types.handleEmote(url, file, key))
    this.registry.register('avatar', (url, file, key) => this.types.handleAvatar(url, file, key))
    this.registry.register('script', (url, file, key) => this.types.handleScript(url, file, key))
    this.registry.register('audio', (url, file, key) => this.types.handleAudio(url, file, key))
  }

  setVRMHooks(hooks) {
    this.types.setVRMHooks(hooks)
  }

  handle(type, url, file, key) {
    return this.registry.handle(type, url, file, key)
  }

  handleInsert(type, localUrl, url, file, key) {
    if (!this.insertRegistry.has(type)) {
      this.setupInsertHandlers(localUrl, url, file, key)
    }
    return this.insertRegistry.handle(type, localUrl, url, file, key)
  }

  setupInsertHandlers(localUrl, url, file, key) {
    const t = this.types
    this.insertRegistry.register('hdr', (localUrl, url, file, key) =>
      t.rgbeLoader.loadAsync(localUrl).then(texture => {
        this.results.set(key, texture)
        return texture
      })
    )
    this.insertRegistry.register('image', (localUrl, url, file, key) =>
      new Promise(resolve => {
        const img = new Image()
        img.onload = () => {
          this.results.set(key, img)
          resolve(img)
        }
        img.src = localUrl
      })
    )
    this.insertRegistry.register('video', (localUrl, url, file, key) =>
      Promise.resolve(createVideoFactory(localUrl, this.world))
    )
    this.insertRegistry.register('texture', (localUrl, url, file, key) =>
      t.texLoader.loadAsync(localUrl).then(texture => {
        this.results.set(key, texture)
        return texture
      })
    )
    this.insertRegistry.register('model', (localUrl, url, file, key) =>
      t.gltfLoader.loadAsync(localUrl).then(glb => {
        const model = AssetResults.createModel(glbToNodes(glb, this.world), file, glb.scene)
        this.results.set(key, model)
        return model
      })
    )
    this.insertRegistry.register('emote', (localUrl, url, file, key) =>
      t.gltfLoader.loadAsync(localUrl).then(glb => {
        const emote = { toClip: options => AvatarFactory.createEmote(glb, url).toClip(options) }
        this.results.set(key, emote)
        return emote
      })
    )
    this.insertRegistry.register('avatar', (localUrl, url, file, key) =>
      t.gltfLoader.loadAsync(localUrl).then(glb => {
        const avatar = AssetResults.createAvatar(AvatarFactory.createVRM(glb, t.setupMaterial), file, t.vrmHooks)
        this.results.set(key, avatar)
        return avatar
      })
    )
    this.insertRegistry.register('script', (localUrl, url, file, key) =>
      file.text().then(code => {
        const script = this.clientLoader.scripts.evaluate(code)
        this.results.set(key, script)
        return script
      })
    )
    this.insertRegistry.register('audio', (localUrl, url, file, key) =>
      file.arrayBuffer().then(buffer =>
        this.clientLoader.audio.ctx.decodeAudioData(buffer)
      ).then(audioBuffer => {
        this.results.set(key, audioBuffer)
        return audioBuffer
      })
    )
  }
}
