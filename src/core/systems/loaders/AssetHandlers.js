import * as THREE from '../../extras/three.js'
import Hls from 'hls.js/dist/hls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { glbToNodes } from '../../extras/glbToNodes.js'
import { createEmoteFactory } from '../../extras/createEmoteFactory.js'
import { createVRMFactory } from '../../extras/createVRMFactory.js'
import { createNode } from '../../extras/createNode.js'
import { AssetHandlerRegistry } from './AssetHandlerRegistry.js'
import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('AssetHandlers')

function createVideoFactory(url, world) {
  const isHLS = url?.endsWith('.m3u8')
  const sources = {}
  let width
  let height
  let duration
  let ready = false
  let prepare

  const createSource = (key) => {
    const elem = document.createElement('video')
    elem.crossOrigin = 'anonymous'
    elem.playsInline = true
    elem.loop = false
    elem.muted = true
    elem.style.width = '1px'
    elem.style.height = '1px'
    elem.style.position = 'absolute'
    elem.style.opacity = '0'
    elem.style.zIndex = '-1000'
    elem.style.pointerEvents = 'none'
    elem.style.overflow = 'hidden'

    const needsPolyfill = isHLS && !elem.canPlayType('application/vnd.apple.mpegurl') && Hls.isSupported()
    if (needsPolyfill) {
      const hls = new Hls()
      hls.loadSource(url)
      hls.attachMedia(elem)
    } else {
      elem.src = url
    }

    const audio = world.audio.ctx.createMediaElementSource(elem)
    let n = 0
    let dead

    world.audio.ready(() => {
      if (dead) return
      elem.muted = false
    })

    const texture = new THREE.VideoTexture(elem)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.anisotropy = world.graphics.maxAnisotropy

    if (!prepare) {
      prepare = (function () {
        return new Promise(async resolve => {
          let playing = false
          let data = false
          elem.addEventListener(
            'loadeddata',
            async () => {
              if (playing) elem.pause()
              data = true
              width = elem.videoWidth
              height = elem.videoHeight
              duration = elem.duration
              ready = true
              resolve()
            },
            { once: true }
          )
          elem.addEventListener(
            'loadedmetadata',
            async () => {
              if (data) return
              elem.play()
              playing = true
            },
            { once: true }
          )
        })
      })()
    }

    const isPlaying = () => {
      return elem.currentTime > 0 && !elem.paused && !elem.ended && elem.readyState > 2
    }

    const play = (restartIfPlaying = false) => {
      if (restartIfPlaying) elem.currentTime = 0
      elem.play()
    }

    const pause = () => {
      elem.pause()
    }

    const stop = () => {
      elem.currentTime = 0
      elem.pause()
    }

    const release = () => {
      n--
      if (n === 0) {
        stop()
        audio.disconnect()
        texture.dispose()
        document.body.removeChild(elem)
        delete sources[key]
        elem.src = ''
        elem.load()
      }
    }

    const handle = {
      elem,
      audio,
      texture,
      prepare,
      get ready() {
        return ready
      },
      get width() {
        return width
      },
      get height() {
        return height
      },
      get duration() {
        return duration
      },
      get loop() {
        return elem.loop
      },
      set loop(value) {
        elem.loop = value
      },
      get isPlaying() {
        return isPlaying()
      },
      get currentTime() {
        return elem.currentTime
      },
      set currentTime(value) {
        elem.currentTime = value
      },
      play,
      pause,
      stop,
      release,
    }

    return {
      createHandle() {
        n++
        if (n === 1) {
          document.body.appendChild(elem)
        }
        return handle
      },
    }
  }

  return {
    get(key) {
      let source = sources[key]
      if (!source) {
        source = createSource(key)
        sources[key] = source
      }
      return source.createHandle()
    },
  }
}

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
    this.fallbackManager = clientLoader.fallbackManager
    this.vrmHooks = null
    this.registry = new AssetHandlerRegistry()
    this.insertRegistry = new AssetHandlerRegistry()
    this.setupHandlers()
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
        const model = this.createModelResult(glbToNodes(glb, this.world), file, glb.scene)
        this.results.set(key, model)
        return model
      })
    )
    this.insertRegistry.register('emote', (localUrl, url, file, key) =>
      this.gltfLoader.loadAsync(localUrl).then(glb => {
        const emote = { toClip: options => createEmoteFactory(glb, url).toClip(options) }
        this.results.set(key, emote)
        return emote
      })
    )
    this.insertRegistry.register('avatar', (localUrl, url, file, key) =>
      this.gltfLoader.loadAsync(localUrl).then(glb => {
        const avatar = this.createAvatarResult(createVRMFactory(glb, this.setupMaterial), file)
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
      const model = this.createModelResult(glbToNodes(glb, this.world), file, glb.scene)
      this.results.set(key, model)
      return model
    }).catch(err => {
      logger.error('Model parse error', { url, error: err.message })
      const fallback = this.fallbackManager.getFallback('model', url, err)
      if (fallback) {
        this.results.set(key, fallback)
        return fallback
      }
      throw err
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
    }).catch(err => {
      logger.error('Script evaluation error', { url, error: err.message })
      const fallback = this.fallbackManager.getFallback('script', url, err)
      if (fallback) {
        this.results.set(key, fallback)
        return fallback
      }
      throw err
    })
  }

  handleAudio(url, file, key) {
    return file.arrayBuffer().then(buffer =>
      this.audio.ctx.decodeAudioData(buffer)
    ).then(audioBuffer => {
      this.results.set(key, audioBuffer)
      return audioBuffer
    }).catch(err => {
      logger.error('Audio decode error', { url, error: err.message })
      const fallback = this.fallbackManager.getFallback('audio', url, err)
      if (fallback) {
        this.results.set(key, fallback)
        return fallback
      }
      throw err
    })
  }

  createModelResult(node, file, glbScene = null) {
    return {
      toNodes() { return node.clone(true) },
      getScene() { return glbScene?.clone() },
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

}
