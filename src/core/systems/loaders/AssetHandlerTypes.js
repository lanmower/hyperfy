import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { GLTFLoader } from '../../libs/gltfloader/GLTFLoader.js'
import { VRMLoaderPlugin } from '../../libs/three-vrm/index.js'
import { glbToNodes } from '../../extras/glbToNodes.js'
import { AvatarFactory } from '../../extras/avatar/AvatarFactory.js'
import { StructuredLogger } from '../../utils/logging/index.js'
import { createVideoFactory } from './VideoFactory.js'
import { AssetResults } from './AssetResults.js'
import * as pc from '../../extras/playcanvas.js'

const logger = new StructuredLogger('AssetHandlerTypes')

export class AssetHandlerTypes {
  constructor(clientLoader, world) {
    this.clientLoader = clientLoader
    this.world = world
    this.resolveURL = world.resolveURL
    this.setupMaterial = world.setupMaterial
    this.results = clientLoader.results
    this.fallbackManager = clientLoader.fallbackManager
    this.audio = clientLoader.audio
    this.scripts = clientLoader.scripts
    this.rgbeLoader = new RGBELoader()
    this.gltfLoader = new GLTFLoader()
    this.gltfLoader.register(exporter => new VRMLoaderPlugin(exporter))
    this.vrmHooks = null
    this.gd = world.gd || null
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

  handleVideo(url, file, key) {
    return Promise.resolve(createVideoFactory(this.resolveURL(url), this.world))
  }

  handleHDR(url, file, key) {
    const loadPromise = file
      ? file.arrayBuffer()
      : this.clientLoader.fetchArrayBuffer(url)
    return loadPromise.then(buffer => {
      const result = this.rgbeLoader.parse(buffer)
      let texture = null
      if (this.gd) {
        const pcTexture = new pc.Texture(this.gd, {
          width: result.width,
          height: result.height,
          format: pc.PIXELFORMAT_RGBA32F,
          mipmaps: false,
          addressU: pc.ADDRESS_CLAMP_TO_EDGE,
          addressV: pc.ADDRESS_CLAMP_TO_EDGE
        })
        if (result.data) pcTexture.setData(result.data)
        texture = pcTexture
      } else {
        const canvas = document.createElement('canvas')
        canvas.width = result.width
        canvas.height = result.height
        const ctx = canvas.getContext('2d')
        const imageData = ctx.createImageData(result.width, result.height)
        if (result.data) imageData.data.set(result.data)
        ctx.putImageData(imageData, 0, 0)
        texture = canvas.toDataURL()
      }
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
        let texture = null
        if (this.gd) {
          texture = new pc.Texture(this.gd, {
            width: img.width,
            height: img.height,
            format: pc.PIXELFORMAT_RGBA8
          })
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          texture.setData(ctx.getImageData(0, 0, img.width, img.height).data)
        } else {
          texture = img
        }
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
