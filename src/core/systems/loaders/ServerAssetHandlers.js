import { GLTFLoader } from '../../libs/gltfloader/GLTFLoader.js'
import { glbToNodes } from '../../extras/glbToNodes.js'
import { createNode } from '../../extras/createNode.js'
import { createEmoteFactory } from '../../extras/createEmoteFactory.js'
import { ServerAssetFetcher } from './ServerAssetFetcher.js'

export class ServerAssetHandlers {
  constructor(world, errorMonitor, scripts) {
    this.world = world
    this.errorMonitor = errorMonitor
    this.scripts = scripts
    this.gltfLoader = new GLTFLoader()
  }

  handleModel = (url) => new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await ServerAssetFetcher.fetchArrayBuffer(url)
      this.gltfLoader.parse(arrayBuffer, '',
        glb => {
          const node = glbToNodes(glb, this.world)
          resolve({
            toNodes() {
              return node.clone(true)
            },
          })
        },
        err => {
          if (this.errorMonitor) {
            this.errorMonitor.captureError('gltfloader.error', {
              message: err.message || String(err),
              url: url,
              type: 'model'
            }, err.stack)
          }
          reject(err)
        }
      )
    } catch (err) {
      if (this.errorMonitor) {
        this.errorMonitor.captureError('model.load.error', {
          message: err.message || String(err),
          url: url,
          type: 'model'
        }, err.stack)
      }
      reject(err)
    }
  })

  handleEmote = (url) => new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await ServerAssetFetcher.fetchArrayBuffer(url)
      this.gltfLoader.parse(arrayBuffer, '',
        glb => {
          const factory = createEmoteFactory(glb, url)
          resolve({
            toClip(options) {
              return factory.toClip(options)
            },
          })
        },
        err => {
          if (this.errorMonitor) {
            this.errorMonitor.captureError('gltfloader.error', {
              message: err.message || String(err),
              url: url,
              type: 'emote'
            }, err.stack)
          }
          reject(err)
        }
      )
    } catch (err) {
      if (this.errorMonitor) {
        this.errorMonitor.captureError('emote.load.error', {
          message: err.message || String(err),
          url: url,
          type: 'emote'
        }, err.stack)
      }
      reject(err)
    }
  })

  handleAvatar = (url) => new Promise(async (resolve, reject) => {
    try {
      let node
      resolve({
        toNodes: () => {
          if (!node) {
            node = createNode('group')
            const node2 = createNode('avatar', { id: 'avatar', factory: null })
            node.add(node2)
          }
          return node.clone(true)
        },
      })
    } catch (err) {
      reject(err)
    }
  })

  handleScript = (url) => new Promise(async (resolve, reject) => {
    try {
      const code = await ServerAssetFetcher.fetchText(url)
      const script = this.scripts.evaluate(code)
      resolve(script)
    } catch (err) {
      reject(err)
    }
  })

  handleAudio = (url) => new Promise(async (resolve, reject) => {
    reject(null)
  })

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
