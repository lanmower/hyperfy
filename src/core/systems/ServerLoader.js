import fs from 'fs-extra'
import path from 'path'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GLTFLoader } from '../libs/gltfloader/GLTFLoader.js'
// import { VRMLoaderPlugin } from '@pixiv/three-vrm'

import { System } from './System.js'
import { createVRMFactory } from '../extras/createVRMFactory.js'
import { glbToNodes } from '../extras/glbToNodes.js'
import { createNode } from '../extras/createNode.js'
import { createEmoteFactory } from '../extras/createEmoteFactory.js'

/**
 * Server Loader System
 *
 * - Runs on the server
 * - Basic file loader for many different formats, cached.
 *
 */
export class ServerLoader extends System {
  constructor(world) {
    super(world)
    this.promises = new Map()
    this.results = new Map()
    this.rgbeLoader = new RGBELoader()
    this.gltfLoader = new GLTFLoader()
    this.preloadItems = []
    this.setupTypeRegistry()

    // mock globals to allow gltf loader to work in nodejs
    globalThis.self = { URL }
    globalThis.window = {}
    globalThis.document = {
      createElementNS: () => ({ style: {} }),
    }
  }

  setupTypeRegistry() {
    this.typeHandlers = {
      'model': (url) => new Promise(async (resolve, reject) => {
        try {
          const arrayBuffer = await this.fetchArrayBuffer(url)
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
              if (this.world.errorMonitor) {
                this.world.errorMonitor.captureError('gltfloader.error', {
                  message: err.message || String(err),
                  url: url,
                  type: 'model'
                }, err.stack)
              }
              reject(err)
            }
          )
        } catch (err) {
          if (this.world.errorMonitor) {
            this.world.errorMonitor.captureError('model.load.error', {
              message: err.message || String(err),
              url: url,
              type: 'model'
            }, err.stack)
          }
          reject(err)
        }
      }),
      'emote': (url) => new Promise(async (resolve, reject) => {
        try {
          const arrayBuffer = await this.fetchArrayBuffer(url)
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
              if (this.world.errorMonitor) {
                this.world.errorMonitor.captureError('gltfloader.error', {
                  message: err.message || String(err),
                  url: url,
                  type: 'emote'
                }, err.stack)
              }
              reject(err)
            }
          )
        } catch (err) {
          if (this.world.errorMonitor) {
            this.world.errorMonitor.captureError('emote.load.error', {
              message: err.message || String(err),
              url: url,
              type: 'emote'
            }, err.stack)
          }
          reject(err)
        }
      }),
      'avatar': (url) => new Promise(async (resolve, reject) => {
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
      }),
      'script': (url) => new Promise(async (resolve, reject) => {
        try {
          const code = await this.fetchText(url)
          const script = this.world.scripts.evaluate(code)
          resolve(script)
        } catch (err) {
          reject(err)
        }
      }),
      'audio': (url) => new Promise(async (resolve, reject) => {
        reject(null)
      }),
    }
  }

  start() {
    // ...
  }

  has(type, url) {
    const key = `${type}/${url}`
    return this.promises.has(key)
  }

  get(type, url) {
    const key = `${type}/${url}`
    return this.results.get(key)
  }

  preload(type, url) {
    this.preloadItems.push({ type, url })
  }

  execPreload() {
    const promises = this.preloadItems.map(item => this.load(item.type, item.url))
    this.preloader = Promise.allSettled(promises).then(() => {
      this.preloader = null
    })
  }

  async fetchArrayBuffer(url) {
    const isRemote = url.startsWith('http://') || url.startsWith('https://')
    if (isRemote) {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      return arrayBuffer
    } else {
      const buffer = await fs.readFile(url)
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
      return arrayBuffer
    }
  }

  async fetchText(url) {
    const isRemote = url.startsWith('http://') || url.startsWith('https://')
    if (isRemote) {
      const response = await fetch(url)
      const text = await response.text()
      return text
    } else {
      const text = await fs.readFile(url, { encoding: 'utf8' })
      return text
    }
  }

  load(type, url) {
    const key = `${type}/${url}`
    if (this.promises.has(key)) {
      return this.promises.get(key)
    }
    url = this.world.resolveURL(url, true)
    const handler = this.typeHandlers[type]
    if (!handler) {
      console.warn(`No handler for asset type: ${type}`)
      return Promise.resolve(null)
    }
    const promise = handler(url).then(result => {
      this.results.set(key, result)
      return result
    })
    this.promises.set(key, promise)
    return promise
  }

  destroy() {
    this.promises.clear()
    this.results.clear()
    this.preloadItems = []
  }
}
