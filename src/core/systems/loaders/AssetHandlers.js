import * as THREE from '../../extras/three.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { GLTFLoader } from '../../libs/gltfloader/GLTFLoader.js'
import { VRMLoaderPlugin } from '../../libs/three-vrm/index.js'
import { glbToNodes } from '../../extras/glbToNodes.js'
import { AvatarFactory } from '../../extras/avatar/AvatarFactory.js'
import { BaseAssetHandler } from './BaseAssetHandler.js'
import { AssetHandlerRegistry } from './AssetHandlerRegistry.js'
import { StructuredLogger } from '../../utils/logging/index.js'
import { createVideoFactory } from './VideoFactory.js'
import { AssetResults } from './AssetResults.js'

const logger = new StructuredLogger('AssetHandlers')

export class AssetHandlers extends BaseAssetHandler {
  constructor(clientLoader, world) {
    super()
    this.clientLoader = clientLoader
    this.rgbeLoader = new RGBELoader()
    this.texLoader = new THREE.TextureLoader()
    this.gltfLoader = new GLTFLoader()
    this.gltfLoader.register(exporter => new VRMLoaderPlugin(exporter))
    this.audio = clientLoader.audio
    this.scripts = clientLoader.scripts
    this.world = world
    this.resolveURL = world.resolveURL
    this.setupMaterial = world.setupMaterial
    this.results = clientLoader.results
    this.fallbackManager = clientLoader.fallbackManager
    this.vrmHooks = null
    this.insertRegistry = new AssetHandlerRegistry()
  }

  setupHandlers() {
    this.registry.register('video', (url, file, key) => this.handleVideo(url, file, key))
    this.registry.register('hdr', (url, file, key) => this.handleHDR(url, file, key))
    this.registry.register('image', (url, file, key) => this.handleImage(url, file, key))
    this.registry.register('texture', (url, file, key) => this.handleTexture(url, file, key))
    this.registry.register('model', (url, file, key) => this.handleModel(url, file, key))
    this.registry.register('emote', (url, file, key) => this.handleEmote(url, file, key))
    this.registry.register('avatar', (url, file, key) => this.handleAvatar(url, file, key))
    this.registry.register('script', (url, file, key) => this.handleScript(url, file, key))
    this.registry.register('audio', (url, file, key) => this.handleAudio(url, file, key))
  }

  setVRMHooks(hooks) {
    this.vrmHooks = hooks
  }

  async withFallback(type, url, key, promise) {
    try {
      return await promise
    } catch (err) {
      logger.error(`${type} error`, { url, error: err.message })
      const fallback = this.fallbackManager?.getFallback(type, url, err)
      if (fallback) {
        this.results.set(key, fallback)
        return fallback
      }
      throw err
    }
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
    this.insertRegistry.register('hdr', (localUrl, url, file, key) =>
      this.rgbeLoader.loadAsync(localUrl).then(texture => {
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
      this.texLoader.loadAsync(localUrl).then(texture => {
        this.results.set(key, texture)
        return texture
      })
    )
    this.insertRegistry.register('model', (localUrl, url, file, key) =>
      this.gltfLoader.loadAsync(localUrl).then(glb => {
        const model = AssetResults.createModel(glbToNodes(glb, this.world), file, glb.scene)
        this.results.set(key, model)
        return model
      })
    )
    this.insertRegistry.register('emote', (localUrl, url, file, key) =>
      this.gltfLoader.loadAsync(localUrl).then(glb => {
        const emote = { toClip: options => AvatarFactory.createEmote(glb, url).toClip(options) }
        this.results.set(key, emote)
        return emote
      })
    )
    this.insertRegistry.register('avatar', (localUrl, url, file, key) =>
      this.gltfLoader.loadAsync(localUrl).then(glb => {
        const avatar = AssetResults.createAvatar(AvatarFactory.createVRM(glb, this.setupMaterial), file, this.vrmHooks)
        this.results.set(key, avatar)
        return avatar
      })
    )
    this.insertRegistry.register('script', (localUrl, url, file, key) =>
      file.text().then(code => {
        const script = this.scripts.evaluate(code)
        this.results.set(key, script)
        return script
      })
    )
    this.insertRegistry.register('audio', (localUrl, url, file, key) =>
      file.arrayBuffer().then(buffer =>
        this.audio.ctx.decodeAudioData(buffer)
      ).then(audioBuffer => {
        this.results.set(key, audioBuffer)
        return audioBuffer
      })
    )
  }

  handleVideo(url, file, key) {
    return Promise.resolve(createVideoFactory(this.resolveURL(url), this.world))
  }

  handleHDR(url, file, key) {
    const loadPromise = file
      ? file.arrayBuffer()
      : this.clientLoader.fetchArrayBuffer(url)
    return loadPromise.then(buffer => {
      const result = this.rgbeLoader.parse(buffer)
      const texture = new THREE.DataTexture(result.data, result.width, result.height, result.format)
      texture.colorSpace = THREE.LinearSRGBColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.generateMipmaps = false
      texture.flipY = true
      texture.type = result.type
      texture.needsUpdate = true
      if (key) this.results.set(key, texture)
      return texture
    })
  }

  handleImage(url, file, key) {
    return new Promise(resolve => {
      const img = new Image()
      img.onload = () => {
        this.results.set(key, img)
        resolve(img)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  handleTexture(url, file, key) {
    return new Promise(resolve => {
      const img = new Image()
      img.onload = () => {
        const texture = this.texLoader.load(img.src)
        this.results.set(key, texture)
        resolve(texture)
        URL.revokeObjectURL(img.src)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  handleModel(url, file, key) {
    const loadPromise = file
      ? file.arrayBuffer()
      : this.clientLoader.fetchArrayBuffer(url)
    return this.withFallback('model', url, key, loadPromise.then(async buffer => {
      const glb = await this.gltfLoader.parseAsync(buffer)
      const model = AssetResults.createModel(glbToNodes(glb, this.world), file, glb.scene)
      this.results.set(key, model)
      return model
    }))
  }

  handleEmote(url, file, key) {
    const loadPromise = file
      ? file.arrayBuffer()
      : this.clientLoader.fetchArrayBuffer(url)
    return loadPromise.then(async buffer => {
      const glb = await this.gltfLoader.parseAsync(buffer)
      const emote = { toClip: options => AvatarFactory.createEmote(glb, url).toClip(options) }
      this.results.set(key, emote)
      return emote
    })
  }

  handleAvatar(url, file, key) {
    const loadPromise = file
      ? file.arrayBuffer()
      : this.clientLoader.fetchArrayBuffer(url)
    return loadPromise.then(async buffer => {
      const glb = await this.gltfLoader.parseAsync(buffer)
      if (!glb.userData?.vrm) {
        throw new Error(`VRM data missing from loaded asset - VRM plugin may not have registered properly`)
      }
      const avatar = AssetResults.createAvatar(AvatarFactory.createVRM(glb, this.setupMaterial), file, this.vrmHooks)
      this.results.set(key, avatar)
      return avatar
    })
  }

  handleScript(url, file, key) {
    if (!this.scripts) return Promise.reject(new Error('Scripts system not initialized'))
    const loadPromise = file
      ? file.text()
      : this.clientLoader.fetchText(url)
    return this.withFallback('script', url, key, loadPromise.then(code => {
      const script = this.scripts.evaluate(code)
      this.results.set(key, script)
      return script
    }))
  }

  handleAudio(url, file, key) {
    if (!this.audio) return Promise.reject(new Error('Audio system not initialized'))
    const loadPromise = file
      ? file.arrayBuffer()
      : this.clientLoader.fetchArrayBuffer(url)
    return this.withFallback('audio', url, key, loadPromise.then(buffer =>
      this.audio.ctx.decodeAudioData(buffer)
    ).then(audioBuffer => {
      this.results.set(key, audioBuffer)
      return audioBuffer
    }))
  }

}
