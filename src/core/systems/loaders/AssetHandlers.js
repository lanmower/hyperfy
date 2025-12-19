import * as THREE from '../../extras/three.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { glbToNodes } from '../../extras/glbToNodes.js'
import { createEmoteFactory } from '../../extras/createEmoteFactory.js'
import { createVRMFactory } from '../../extras/createVRMFactory.js'
import { createNode } from '../../extras/createNode.js'
import { createVideoFactory } from './VideoFactory.js'

export class AssetHandlers {
  constructor(clientLoader, world) {
    this.clientLoader = clientLoader
    this.rgbeLoader = new RGBELoader()
    this.texLoader = new THREE.TextureLoader()
    this.gltfLoader = clientLoader.gltfLoader
    this.audio = clientLoader.audio
    this.scripts = clientLoader.scripts
    this.world = world
    this.resolveURL = world.resolveURL
    this.setupMaterial = world.setupMaterial
    this.results = clientLoader.results
    this.vrmHooks = null
  }

  setVRMHooks(hooks) {
    this.vrmHooks = hooks
  }

  handle(type, url, file, key) {
    const handlers = {
      video: () => this.handleVideo(url, file, key),
      hdr: () => this.handleHDR(url, file, key),
      image: () => this.handleImage(url, file, key),
      texture: () => this.handleTexture(url, file, key),
      model: () => this.handleModel(url, file, key),
      emote: () => this.handleEmote(url, file, key),
      avatar: () => this.handleAvatar(url, file, key),
      script: () => this.handleScript(url, file, key),
      audio: () => this.handleAudio(url, file, key),
    }
    return handlers[type]?.()
  }

  handleInsert(type, localUrl, url, file, key) {
    const handlers = this.getInsertHandlers(localUrl, url, file, key)
    return handlers[type]?.()
  }

  handleVideo(url, file, key) {
    return new Promise(resolve => {
      const factory = createVideoFactory(this.resolveURL(url), this.world)
      resolve(factory)
    })
  }

  handleHDR(url, file, key) {
    return file.arrayBuffer().then(buffer => {
      const result = this.rgbeLoader.parse(buffer)
      const texture = new THREE.DataTexture(result.data, result.width, result.height)
      texture.colorSpace = THREE.LinearSRGBColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.generateMipmaps = false
      texture.flipY = true
      texture.type = result.type
      texture.needsUpdate = true
      this.results.set(key, texture)
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
    return file.arrayBuffer().then(async buffer => {
      const glb = await this.gltfLoader.parseAsync(buffer)
      const model = this.createModelResult(glbToNodes(glb, this.world), file)
      this.results.set(key, model)
      return model
    })
  }

  handleEmote(url, file, key) {
    return file.arrayBuffer().then(async buffer => {
      const glb = await this.gltfLoader.parseAsync(buffer)
      const emote = { toClip: options => createEmoteFactory(glb, url).toClip(options) }
      this.results.set(key, emote)
      return emote
    })
  }

  handleAvatar(url, file, key) {
    return file.arrayBuffer().then(async buffer => {
      const glb = await this.gltfLoader.parseAsync(buffer)
      const avatar = this.createAvatarResult(createVRMFactory(glb, this.setupMaterial), file)
      this.results.set(key, avatar)
      return avatar
    })
  }

  handleScript(url, file, key) {
    return file.text().then(code => {
      const script = this.scripts.evaluate(code)
      this.results.set(key, script)
      return script
    })
  }

  handleAudio(url, file, key) {
    return file.arrayBuffer().then(buffer =>
      this.audio.ctx.decodeAudioData(buffer)
    ).then(audioBuffer => {
      this.results.set(key, audioBuffer)
      return audioBuffer
    })
  }

  createModelResult(node, file) {
    return {
      toNodes() { return node.clone(true) },
      getStats() {
        const stats = node.getStats(true)
        stats.fileBytes = file.size
        return stats
      },
    }
  }

  createAvatarResult(factory, file) {
    const node = createNode('group', { id: '$root' })
    node.add(createNode('avatar', { id: 'avatar', factory, hooks: this.vrmHooks }))
    return {
      factory,
      hooks: this.vrmHooks,
      toNodes(customHooks) {
        const clone = node.clone(true)
        if (customHooks) clone.get('avatar').hooks = customHooks
        return clone
      },
      getStats() {
        const stats = node.getStats(true)
        stats.fileBytes = file.size
        return stats
      },
    }
  }

  getInsertHandlers(localUrl, url, file, key) {
    return {
      hdr: () => this.rgbeLoader.loadAsync(localUrl).then(texture => {
        this.results.set(key, texture)
        return texture
      }),
      image: () => new Promise(resolve => {
        const img = new Image()
        img.onload = () => {
          this.results.set(key, img)
          resolve(img)
        }
        img.src = localUrl
      }),
      video: () => Promise.resolve(createVideoFactory(localUrl, this.world)),
      texture: () => this.texLoader.loadAsync(localUrl).then(texture => {
        this.results.set(key, texture)
        return texture
      }),
      model: () => this.gltfLoader.loadAsync(localUrl).then(glb => {
        const model = this.createModelResult(glbToNodes(glb, this.world), file)
        this.results.set(key, model)
        return model
      }),
      emote: () => this.gltfLoader.loadAsync(localUrl).then(glb => {
        const emote = { toClip: options => createEmoteFactory(glb, url).toClip(options) }
        this.results.set(key, emote)
        return emote
      }),
      avatar: () => this.gltfLoader.loadAsync(localUrl).then(glb => {
        const avatar = this.createAvatarResult(createVRMFactory(glb, this.setupMaterial), file)
        this.results.set(key, avatar)
        return avatar
      }),
      script: () => file.text().then(code => {
        const script = this.scripts.evaluate(code)
        this.results.set(key, script)
        return script
      }),
      audio: () => file.arrayBuffer().then(buffer =>
        this.audio.ctx.decodeAudioData(buffer)
      ).then(audioBuffer => {
        this.results.set(key, audioBuffer)
        return audioBuffer
      }),
    }
  }
}
