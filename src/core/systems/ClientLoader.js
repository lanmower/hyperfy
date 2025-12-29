import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'

import { BaseLoader } from './BaseLoader.js'
import { AssetHandlers } from './loaders/AssetHandlers.js'
import { FileManager } from './loaders/FileManager.js'
import { FallbackManager } from './loaders/FallbackManager.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('ClientLoader')

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
    this.fallbackManager = new FallbackManager()
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
            logger.error('Error preloading asset', { type: item.type, url: item.url, error: err.message })
          })
      )
      this.preloader = Promise.allSettled(promises).then(() => { this.preloader = null }).catch(err => {
        logger.error('Preload completed with errors', { error: err.message })
        this.preloader = null
      })
    } catch (err) {
      logger.error('Error in execPreload', { error: err.message })
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
          logger.error('Error loading file', { url, error: fileErr.message })
          const fallback = this.fallbackManager.getFallback(type, url, fileErr)
          if (fallback) {
            this.results.set(key, fallback)
            return fallback
          }
          return null
        }
      }

      const promise = this.assetHandlers.handle(type, url, file, key)
      if (!promise) {
        logger.warn('No handler for asset type', { type })
        const fallback = this.fallbackManager.getFallback(type, url, new Error('No handler'))
        if (fallback) {
          this.results.set(key, fallback)
          return fallback
        }
        return null
      }
      this.promises.set(key, promise)
      const result = await promise
      return result
    } catch (err) {
      logger.error('Error loading asset', { type, url, error: err.message })
      const fallback = this.fallbackManager.getFallback(type, url, err)
      if (fallback) {
        const key = `${type}/${url}`
        this.results.set(key, fallback)
        return fallback
      }
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
        logger.error('Error creating object URL', { error: urlErr.message })
        return
      }

      const promise = this.assetHandlers.handleInsert(type, objectUrl, url, file, key)
      if (promise) this.promises.set(key, promise)
    } catch (err) {
      logger.error('Error in insert', { type, url, error: err.message })
    }
  }

  getFallbackLog() {
    return this.fallbackManager.getUsageLog()
  }

  destroy() {
    this.fileManager.clear()
    this.promises.clear()
    this.results.clear()
    this.preloadItems = []
  }
}
