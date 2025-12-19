import fs from 'fs-extra'
import { GLTFLoader } from '../../libs/gltfloader/GLTFLoader.js'
import { glbToNodes } from '../../extras/glbToNodes.js'
import { createNode } from '../../extras/createNode.js'
import { createEmoteFactory } from '../../extras/createEmoteFactory.js'

export class ServerAssetHandlers {
  constructor(world, errorMonitor, scripts) {
    this.world = world
    this.errorMonitor = errorMonitor
    this.scripts = scripts
    this.gltfLoader = new GLTFLoader()
  }

  async fetchArrayBuffer(url) {
    const isRemote = url.startsWith('http://') || url.startsWith('https://')
    if (isRemote) {
      const response = await fetch(url)
      return await response.arrayBuffer()
    }
    const buffer = await fs.readFile(url)
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  }

  async fetchText(url) {
    const isRemote = url.startsWith('http://') || url.startsWith('https://')
    if (isRemote) {
      const response = await fetch(url)
      return await response.text()
    }
    return await fs.readFile(url, { encoding: 'utf8' })
  }

  handleModel = (url) => new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await this.fetchArrayBuffer(url)
      this.gltfLoader.parse(arrayBuffer, '',
        glb => resolve({ toNodes: () => glbToNodes(glb, this.world).clone(true) }),
        err => {
          this.errorMonitor?.captureError('gltfloader.error', {
            message: err.message || String(err), url, type: 'model'
          }, err.stack)
          reject(err)
        }
      )
    } catch (err) {
      this.errorMonitor?.captureError('model.load.error', {
        message: err.message || String(err), url, type: 'model'
      }, err.stack)
      reject(err)
    }
  })

  handleEmote = (url) => new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await this.fetchArrayBuffer(url)
      this.gltfLoader.parse(arrayBuffer, '',
        glb => {
          const factory = createEmoteFactory(glb, url)
          resolve({ toClip: options => factory.toClip(options) })
        },
        err => {
          this.errorMonitor?.captureError('gltfloader.error', {
            message: err.message || String(err), url, type: 'emote'
          }, err.stack)
          reject(err)
        }
      )
    } catch (err) {
      this.errorMonitor?.captureError('emote.load.error', {
        message: err.message || String(err), url, type: 'emote'
      }, err.stack)
      reject(err)
    }
  })

  handleAvatar = (url) => new Promise((resolve, reject) => {
    try {
      let node
      resolve({
        toNodes: () => {
          if (!node) {
            node = createNode('group')
            node.add(createNode('avatar', { id: 'avatar', factory: null }))
          }
          return node.clone(true)
        },
      })
    } catch (err) {
      reject(err)
    }
  })

  handleScript = async (url) => {
    const code = await this.fetchText(url)
    return this.scripts.evaluate(code)
  }

  handleAudio = (url) => Promise.reject(null)

  getHandlers() {
    return {
      'model': this.handleModel,
      'emote': this.handleEmote,
      'avatar': this.handleAvatar,
      'script': this.handleScript,
      'audio': this.handleAudio,
    }
  }
}
