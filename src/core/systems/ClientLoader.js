import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'

import { BaseLoader } from './BaseLoader.js'
import { AssetHandlers } from './loaders/AssetHandlers.js'
import { FileManager } from './loaders/FileManager.js'


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
    this.handlers = new AssetHandlers(this)
    this.fileManager = new FileManager(this)
  }

  get stage() { return this.getService(ClientLoader.DEPS.stage) }
  get scripts() { return this.getService(ClientLoader.DEPS.scripts) }
  get audio() { return this.getService(ClientLoader.DEPS.audio) }
  get events() { return this.getService(ClientLoader.DEPS.events) }
  get camera() { return this.getService(ClientLoader.DEPS.camera) }
  get loader() { return this.getService(ClientLoader.DEPS.loader) }

  getTypeHandlers() {
    return {
      'video': this.handleVideo,
      'hdr': this.handleHDR,
      'image': this.handleImage,
      'texture': this.handleTexture,
      'model': this.handleModel,
      'emote': this.handleEmote,
      'avatar': this.handleAvatar,
      'script': this.handleScript,
      'audio': this.handleAudio,
    }
  }

  handleVideo = (url, file, key) => this.handlers.handleVideo(url, file, key)
  handleHDR = (url, file, key) => this.handlers.handleHDR(url, file, key)
  handleImage = (url, file, key) => this.handlers.handleImage(url, file, key)
  handleTexture = (url, file, key) => this.handlers.handleTexture(url, file, key)
  handleModel = (url, file, key) => this.handlers.handleModel(url, file, key)
  handleEmote = (url, file, key) => this.handlers.handleEmote(url, file, key)
  handleAvatar = (url, file, key) => this.handlers.handleAvatar(url, file, key)
  handleScript = (url, file, key) => this.handlers.handleScript(url, file, key)
  handleAudio = (url, file, key) => this.handlers.handleAudio(url, file, key)

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
    this.fileManager.setFile(url, file)
  }

  hasFile(url) {
    return this.fileManager.hasFile(url)
  }

  getFile(url, name) {
    return this.fileManager.getFile(url, name)
  }

  loadFile = async url => {
    return this.fileManager.loadFile(url)
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
    const insertHandlers = this.handlers.getInsertHandlers(localUrl, url, file, key)
    const handler = insertHandlers[type]
    if (handler) {
      this.promises.set(key, handler())
    }
  }

  destroy() {
    this.fileManager.clear()
    this.promises.clear()
    this.results.clear()
    this.preloadItems = []
  }
}
