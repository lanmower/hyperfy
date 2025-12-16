import fs from 'fs-extra'
import path from 'path'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GLTFLoader } from '../libs/gltfloader/GLTFLoader.js'
// import { VRMLoaderPlugin } from '@pixiv/three-vrm'

import { BaseLoader } from './BaseLoader.js'
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
export class ServerLoader extends BaseLoader {
  constructor(world) {
    super(world)
    this.isServer = true
    this.rgbeLoader = new RGBELoader()
    this.gltfLoader = new GLTFLoader()

    // mock globals to allow gltf loader to work in nodejs
    globalThis.self = { URL }
    globalThis.window = {}
    globalThis.document = {
      createElementNS: () => ({ style: {} }),
    }
  }

  getTypeHandlers() {
    return {
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

}
