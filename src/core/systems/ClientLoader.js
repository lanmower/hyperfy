import * as THREE from '../../extras/three.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import Hls from 'hls.js/dist/hls.js'

import { BaseLoader } from './BaseLoader.js'
import { createNode } from '../../extras/createNode.js'
import { createVRMFactory } from '../../extras/createVRMFactory.js'
import { glbToNodes } from '../../extras/glbToNodes.js'
import { createEmoteFactory } from '../../extras/createEmoteFactory.js'

export class ClientLoader extends BaseLoader {
  static DEPS = {
    stage: 'stage',
    scripts: 'scripts',
    audio: 'audio',
    events: 'events',
    camera: 'camera',
    loader: 'loader',
  }

  constructor(world) {
    super(world)
    this.isServer = false
    this.gltfLoader = new GLTFLoader()
    this.gltfLoader.register(parser => new VRMLoaderPlugin(parser))
    this.resolveURL = world.resolveURL
    this.setupMaterial = world.setupMaterial
    this.rgbeLoader = new RGBELoader()
    this.texLoader = new THREE.TextureLoader()
    this.files = new Map()
  }

  getTypeHandlers() {
    const types = ['video', 'hdr', 'image', 'texture', 'model', 'emote', 'avatar', 'script', 'audio']
    const handlers = {}
    for (const type of types) {
      const method = `handle${type[0].toUpperCase()}${type.slice(1)}`
      handlers[type] = (url, file, key) => this[method](url, file, key)
    }
    return handlers
  }

  start() {
    this.vrmHooks = {
      camera: this.camera,
      scene: this.stage.scene,
      octree: this.stage.octree,
      setupMaterial: this.setupMaterial,
      loader: this.loader,
    }
  }

  execPreload() {
    let loadedItems = 0
    let totalItems = this.preloadItems.length
    let progress = 0
    const promises = this.preloadItems.map(item => {
      return this.load(item.type, item.url).then(() => {
        loadedItems++
        progress = (loadedItems / totalItems) * 100
        this.events.emit('progress', progress)
      })
    })
    this.preloader = Promise.allSettled(promises).then(() => {
      this.preloader = null
    })
  }

  setFile(url, file) {
    this.files.set(url, file)
  }

  hasFile(url) {
    url = this.resolveURL(url)
    return this.files.has(url)
  }

  getFile(url, name) {
    url = this.resolveURL(url)
    const file = this.files.get(url)
    if (!file) return null
    if (name) {
      return new File([file], name, {
        type: file.type,
        lastModified: file.lastModified,
      })
    }
    return file
  }

  loadFile = async url => {
    url = this.resolveURL(url)
    if (this.files.has(url)) {
      return this.files.get(url)
    }
    const resp = await fetch(url)
    const blob = await resp.blob()
    const file = new File([blob], url.split('/').pop(), { type: blob.type })
    this.files.set(url, file)
    return file
  }

  async load(type, url) {
    if (this.preloader) {
      await this.preloader
    }
    const key = `${type}/${url}`
    if (this.promises.has(key)) {
      return this.promises.get(key)
    }
    const handler = this.typeHandlers[type]
    if (!handler) {
      console.warn(`No handler for asset type: ${type}`)
      return null
    }
    const promise = type === 'video'
      ? handler(url, null, key)
      : this.loadFile(url).then(file => handler(url, file, key))
    this.promises.set(key, promise)
    return promise
  }

  insert(type, url, file) {
    const key = `${type}/${url}`
    const localUrl = URL.createObjectURL(file)
    const insertHandlers = this.getInsertHandlers(localUrl, url, file, key)
    const handler = insertHandlers[type]
    if (handler) {
      this.promises.set(key, handler())
    }
  }

  handleVideo(url, file, key) {
    return new Promise(resolve => {
      const factory = this.createVideoFactory(this.resolveURL(url))
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
        const factory = this.createVideoFactory(localUrl)
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

  createVideoFactory(url) {
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

      const audio = this.world.audio.ctx.createMediaElementSource(elem)
      let n = 0
      let dead

      this.world.audio.ready(() => {
        if (dead) return
        elem.muted = false
      })

      const texture = new THREE.VideoTexture(elem)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.anisotropy = this.world.graphics.maxAnisotropy

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

  destroy() {
    this.files.clear()
    this.promises.clear()
    this.results.clear()
    this.preloadItems = []
  }
}
