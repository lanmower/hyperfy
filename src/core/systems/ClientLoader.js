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
    this.fileManager = new FileManager(world.resolveURL)
    this.assetHandlers = new AssetHandlers(this, world)
  }

  start() {
    this.assetHandlers.setVRMHooks({
      camera: this.camera,
      scene: this.stage.scene,
      octree: this.stage.octree,
      setupMaterial: this.world.setupMaterial,
      loader: this.loader,
    })
  }

  execPreload() {
    let loaded = 0
    const promises = this.preloadItems.map(item =>
      this.load(item.type, item.url).then(() => {
        this.events.emit('progress', (++loaded / this.preloadItems.length) * 100)
      })
    )
    this.preloader = Promise.allSettled(promises).then(() => { this.preloader = null })
  }

  setFile(url, file) { this.fileManager.set(url, file) }
  hasFile(url) { return this.fileManager.has(url) }
  getFile(url, name) { return this.fileManager.get(url, name) }

  async load(type, url) {
    if (this.preloader) await this.preloader
    const key = `${type}/${url}`
    if (this.promises.has(key)) return this.promises.get(key)
    const file = type === 'video' ? null : await this.fileManager.load(url)
    const promise = this.assetHandlers.handle(type, url, file, key)
    if (!promise) {
      console.warn(`No handler for asset type: ${type}`)
      return null
    }
    this.promises.set(key, promise)
    return promise
  }

  insert(type, url, file) {
    const key = `${type}/${url}`
    const promise = this.assetHandlers.handleInsert(type, URL.createObjectURL(file), url, file, key)
    if (promise) this.promises.set(key, promise)
  }

  destroy() {
    this.fileManager.clear()
    this.promises.clear()
    this.results.clear()
    this.preloadItems = []
  }
}
