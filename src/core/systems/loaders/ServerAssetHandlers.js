import fs from 'fs-extra'
import { GLTFLoader } from '../../libs/gltfloader/GLTFLoader.js'
import { glbToNodes } from '../../extras/glbToNodes.js'
import { BaseAssetHandler } from './BaseAssetHandler.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('ServerAssetHandlers')

const isRemoteURL = url => url.startsWith('http://') || url.startsWith('https://')

class NoOpTextureLoader {
  load() { return null }
  loadAsync() { return Promise.resolve(null) }
  setCrossOrigin() { return this }
  setRequestHeader() { return this }
}

export class ServerAssetHandlers extends BaseAssetHandler {
  constructor(world, errors, scripts) {
    super()
    this.world = world
    this.errors = errors
    this.scripts = scripts
    this.gltfLoader = new GLTFLoader()
    this.gltfLoader._serverMode = true
  }

  setupHandlers() {
    this.registry.register('model', url => this.handleModel(url))
    this.registry.register('script', url => this.handleScript(url))
    this.registry.register('audio', url => this.handleAudio(url))
  }

  async fetchArrayBuffer(url) {
    try {
      if (isRemoteURL(url)) {
        const response = await fetch(url)
        if (!response.ok) throw new Error()
        return await response.arrayBuffer()
      }
      const buffer = await fs.readFile(url)
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    } catch (err) {
      logger.error('Failed to fetch array buffer', { url, error: err.message })
      throw err
    }
  }

  async fetchText(url) {
    try {
      if (isRemoteURL(url)) {
        const response = await fetch(url)
        if (!response.ok) throw new Error()
        return await response.text()
      }
      return await fs.readFile(url, { encoding: 'utf8' })
    } catch (err) {
      logger.error('Failed to fetch text', { url, error: err.message })
      throw err
    }
  }

  handleModel = (url) => new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await this.fetchArrayBuffer(url)
      this.gltfLoader.parse(arrayBuffer, '',
        glb => resolve({ toNodes: () => glbToNodes(glb, this.world).clone(true) }),
        err => {
          this.errors?.captureError('gltfloader.error', {
            message: err.message || String(err), url, type: 'model'
          }, err.stack)
          reject(err)
        }
      )
    } catch (err) {
      this.errors?.captureError('model.load.error', {
        message: err.message || String(err), url, type: 'model'
      }, err.stack)
      reject(err)
    }
  })

  handleScript = async (url) => {
    const code = await this.fetchText(url)
    return this.scripts.evaluate(code)
  }

  handleAudio = (url) => Promise.reject(null)
}
