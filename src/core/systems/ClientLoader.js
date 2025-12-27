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
    this.fileManager = new FileManager(world.resolveURL.bind(world))
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
    try {
      let loaded = 0
      const promises = this.preloadItems.map(item =>
        this.load(item.type, item.url)
          .then(() => {
            this.events.emit('progress', (++loaded / this.preloadItems.length) * 100)
          })
          .catch(err => {
            console.error(`[ClientLoader] Error preloading ${item.type}/${item.url}:`, err)
          })
      )
      this.preloader = Promise.allSettled(promises).then(() => { this.preloader = null }).catch(err => {
        console.error('[ClientLoader] Preload completed with errors:', err)
        this.preloader = null
      })
    } catch (err) {
      console.error('[ClientLoader] Error in execPreload:', err)
      this.preloader = null
    }
  }

  setFile(url, file) { this.fileManager.set(url, file) }
  hasFile(url) { return this.fileManager.has(url) }
  getFile(url, name) { return this.fileManager.get(url, name) }

  async load(type, url) {
    try {
      if (this.preloader) await this.preloader
      const key = `${type}/${url}`
      if (this.promises.has(key)) return this.promises.get(key)

      let file = null
      if (type !== 'video') {
        try {
          file = await this.fileManager.load(url)
        } catch (fileErr) {
          console.error(`[ClientLoader] Error loading file (${url}):`, fileErr)
          return null
        }
      }

      const promise = this.assetHandlers.handle(type, url, file, key)
      if (!promise) {
        console.warn(`[ClientLoader] No handler for asset type: ${type}`)
        return null
      }
      this.promises.set(key, promise)
      return await promise
    } catch (err) {
      console.error(`[ClientLoader] Error loading asset (${type}/${url}):`, err)
      return null
    }
  }

  insert(type, url, file) {
    try {
      const key = `${type}/${url}`
      let objectUrl = null
      try {
        objectUrl = URL.createObjectURL(file)
      } catch (urlErr) {
        console.error(`[ClientLoader] Error creating object URL:`, urlErr)
        return
      }

      const promise = this.assetHandlers.handleInsert(type, objectUrl, url, file, key)
      if (promise) this.promises.set(key, promise)
    } catch (err) {
      console.error(`[ClientLoader] Error in insert (${type}/${url}):`, err)
    }
  }

  destroy() {
    this.fileManager.clear()
    this.promises.clear()
    this.results.clear()
    this.preloadItems = []
  }
}
