import * as THREE from '../../extras/three.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { glbToNodes } from '../../extras/glbToNodes.js'
import { createEmoteFactory } from '../../extras/createEmoteFactory.js'
import { createVRMFactory } from '../../extras/createVRMFactory.js'
import { createNode } from '../../extras/createNode.js'
import { createVideoFactory } from './VideoFactory.js'

export class AssetHandlers {
  constructor(clientLoader) {
    this.clientLoader = clientLoader
    this.rgbeLoader = new RGBELoader()
    this.texLoader = new THREE.TextureLoader()
    this.gltfLoader = clientLoader.gltfLoader
    this.audio = clientLoader.audio
    this.scripts = clientLoader.scripts
    this.world = clientLoader.world
    this.resolveURL = clientLoader.resolveURL
    this.setupMaterial = clientLoader.setupMaterial
    this.results = clientLoader.results
    this.vrmHooks = null
  }

  setVRMHooks(hooks) {
    this.vrmHooks = hooks
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
      const node = glbToNodes(glb, this.world)
      const model = {
        toNodes() {
          return node.clone(true)
        },
        getStats() {
          const stats = node.getStats(true)
          stats.fileBytes = file.size
          return stats
        },
      }
      this.results.set(key, model)
      return model
    })
  }

  handleEmote(url, file, key) {
    return file.arrayBuffer().then(async buffer => {
      const glb = await this.gltfLoader.parseAsync(buffer)
      const factory = createEmoteFactory(glb, url)
      const emote = {
        toClip(options) {
          return factory.toClip(options)
        },
      }
      this.results.set(key, emote)
      return emote
    })
  }

  handleAvatar(url, file, key) {
    return file.arrayBuffer().then(async buffer => {
      const glb = await this.gltfLoader.parseAsync(buffer)
      const factory = createVRMFactory(glb, this.setupMaterial)
      const hooks = this.vrmHooks
      const node = createNode('group', { id: '$root' })
      const node2 = createNode('avatar', { id: 'avatar', factory, hooks })
      node.add(node2)
      const avatar = {
        factory,
        hooks,
        toNodes(customHooks) {
          const clone = node.clone(true)
          if (customHooks) {
            clone.get('avatar').hooks = customHooks
          }
          return clone
        },
        getStats() {
          const stats = node.getStats(true)
          stats.fileBytes = file.size
          return stats
        },
      }
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
      video: () => new Promise(resolve => {
        const factory = createVideoFactory(localUrl, this.world)
        resolve(factory)
      }),
      texture: () => this.texLoader.loadAsync(localUrl).then(texture => {
        this.results.set(key, texture)
        return texture
      }),
      model: () => this.gltfLoader.loadAsync(localUrl).then(glb => {
        const node = glbToNodes(glb, this.world)
        const model = {
          toNodes() { return node.clone(true) },
          getStats() {
            const stats = node.getStats(true)
            stats.fileBytes = file.size
            return stats
          },
        }
        this.results.set(key, model)
        return model
      }),
      emote: () => this.gltfLoader.loadAsync(localUrl).then(glb => {
        const factory = createEmoteFactory(glb, url)
        const emote = { toClip(options) { return factory.toClip(options) } }
        this.results.set(key, emote)
        return emote
      }),
      avatar: () => this.gltfLoader.loadAsync(localUrl).then(glb => {
        const factory = createVRMFactory(glb, this.setupMaterial)
        const hooks = this.vrmHooks
        const node = createNode('group', { id: '$root' })
        const node2 = createNode('avatar', { id: 'avatar', factory, hooks })
        node.add(node2)
        const avatar = {
          factory,
          hooks,
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
        this.results.set(key, avatar)
        return avatar
      }),
      script: () => Promise.resolve().then(async () => {
        const code = await file.text()
        const script = this.scripts.evaluate(code)
        this.results.set(key, script)
        return script
      }),
      audio: () => Promise.resolve().then(async () => {
        const arrayBuffer = await file.arrayBuffer()
        const audioBuffer = await this.audio.ctx.decodeAudioData(arrayBuffer)
        this.results.set(key, audioBuffer)
        return audioBuffer
      }),
    }
  }
}
