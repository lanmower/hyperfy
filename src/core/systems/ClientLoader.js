import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'

import { BaseLoader } from './BaseLoader.js'
import { AssetHandlers } from './loaders/AssetHandlers.js'

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
    this.files = new Map()
    this.assetHandlers = new AssetHandlers(this)
    this.typeHandlers = this.getTypeHandlers()
  }

  getTypeHandlers() {
    return {
      video: (url, file, key) => this.assetHandlers.handleVideo(url, file, key),
      hdr: (url, file, key) => this.assetHandlers.handleHDR(url, file, key),
      image: (url, file, key) => this.assetHandlers.handleImage(url, file, key),
      texture: (url, file, key) => this.assetHandlers.handleTexture(url, file, key),
      model: (url, file, key) => this.assetHandlers.handleModel(url, file, key),
      emote: (url, file, key) => this.assetHandlers.handleEmote(url, file, key),
      avatar: (url, file, key) => this.assetHandlers.handleAvatar(url, file, key),
      script: (url, file, key) => this.assetHandlers.handleScript(url, file, key),
      audio: (url, file, key) => this.assetHandlers.handleAudio(url, file, key),
    }
  }

  start() {
    const vrmHooks = {
      camera: this.camera,
      scene: this.stage.scene,
      octree: this.stage.octree,
      setupMaterial: this.setupMaterial,
      loader: this.loader,
    }
    this.assetHandlers.setVRMHooks(vrmHooks)
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
    const insertHandlers = this.assetHandlers.getInsertHandlers(localUrl, url, file, key)
    const handler = insertHandlers[type]
    if (handler) {
      this.promises.set(key, handler())
    }
  }

  destroy() {
    this.files.clear()
    this.promises.clear()
    this.results.clear()
    this.preloadItems = []
  }
}
