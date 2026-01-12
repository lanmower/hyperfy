/* Unified asset coordination for loading, caching, fallback, and URL resolution */

import * as THREE from '../../extras/three.js'
import { createNode } from '../../extras/createNode.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('AssetCoordinator')

export class AssetCoordinator {
  constructor(resolveURL) {
    this.cache = new Map()
    this.loaders = new Map()
    this.fallbacks = []
    this.maxCacheSize = 1000
    this.files = new Map()
    this.resolveURL = resolveURL
    this.fallbacksMap = new Map()
    this.usageLog = []
    this.createFallbacks()
  }

  createFallbacks() {
    this.fallbacksMap.set('model', this.createPlaceholderModel())
    this.fallbacksMap.set('texture', this.createPlaceholderTexture())
    this.fallbacksMap.set('audio', this.createPlaceholderAudio())
    this.fallbacksMap.set('script', this.createPlaceholderScript())
    this.fallbacksMap.set('hdr', this.createPlaceholderHDR())
    this.fallbacksMap.set('avatar', this.createPlaceholderAvatar())
    this.fallbacksMap.set('emote', this.createPlaceholderEmote())
    this.fallbacksMap.set('image', this.createPlaceholderImage())
    this.fallbacksMap.set('video', this.createPlaceholderVideo())
  }

  createPlaceholderModel() {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.8, metalness: 0.2 })
    const mesh = new THREE.Mesh(geometry, material)
    const scene = new THREE.Group()
    scene.add(mesh)
    const node = createNode('group', { id: '$root' })
    return { toNodes() { return node.clone(true) }, getScene() { return scene.clone() }, getStats() { return { triangles: 12, meshes: 1, fileBytes: 0, isFallback: true } } }
  }

  createPlaceholderTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 64, 64)
    const texture = new THREE.CanvasTexture(canvas)
    return texture
  }

  createPlaceholderAudio() {
    const sampleRate = 44100
    const duration = 0.1
    const audioBuffer = new AudioBuffer({ length: sampleRate * duration, numberOfChannels: 1, sampleRate })
    const channelData = audioBuffer.getChannelData(0)
    for (let i = 0; i < channelData.length; i++) channelData[i] = 0
    return audioBuffer
  }

  createPlaceholderScript() {
    return { exec: () => {}, isFallback: true }
  }

  createPlaceholderHDR() {
    const size = 16
    const data = new Float32Array(size * size * 4)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0.5
      data[i + 1] = 0.5
      data[i + 2] = 0.5
      data[i + 3] = 1.0
    }
    const texture = new THREE.DataTexture(data, size, size)
    texture.colorSpace = THREE.LinearSRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.type = THREE.FloatType
    texture.needsUpdate = true
    return texture
  }

  createPlaceholderAvatar() {
    const geometry = new THREE.CapsuleGeometry(0.3, 1.2, 8, 16)
    const material = new THREE.MeshStandardMaterial({ color: 0x808080 })
    const mesh = new THREE.Mesh(geometry, material)
    const node = createNode('group', { id: '$root' })
    return { factory: { raw: { scene: mesh }, isFallback: true }, hooks: null, toNodes() { return node.clone(true) }, getStats() { return { triangles: 128, meshes: 1, fileBytes: 0, isFallback: true } } }
  }

  createPlaceholderEmote() {
    return { toClip: () => null, isFallback: true }
  }

  createPlaceholderImage() {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#cccccc'
    ctx.fillRect(0, 0, 64, 64)
    const img = new Image()
    img.src = canvas.toDataURL()
    return img
  }

  createPlaceholderVideo() {
    return { create: () => { const canvas = document.createElement('canvas')
      canvas.width = 64
      canvas.height = 64
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, 64, 64)
      const texture = new THREE.CanvasTexture(canvas)
      return { texture, dispose: () => {}, isFallback: true } }, isFallback: true }
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
    if (name) return new File([file], name, { type: file.type, lastModified: file.lastModified })
    return file
  }

  registerLoader(type, loader) {
    this.loaders.set(type, loader)
  }

  addFallback(fn) {
    this.fallbacks.push(fn)
  }

  getFallback(type, url, err) {
    const fallback = this.fallbacksMap.get(type)
    if (fallback) {
      this.logFallback(type, url, err)
      return fallback
    }
    return null
  }

  logFallback(type, url, error) {
    const entry = { type, url, error: error?.message || 'Unknown error', timestamp: new Date().toISOString() }
    this.usageLog.push(entry)
    logger.warn('Using fallback resource', { type, url, error: entry.error })
  }

  getUsageLog() {
    return this.usageLog
  }

  async loadFile(url) {
    try {
      url = this.resolveURL(url)
      if (this.files.has(url)) return this.files.get(url)
      const resp = await fetch(url)
      if (!resp.ok) throw new Error(`File load failed: ${resp.status} ${resp.statusText}`)
      const blob = await resp.blob()
      const file = new File([blob], url.split('/').pop(), { type: blob.type })
      this.files.set(url, file)
      return file
    } catch (err) {
      logger.error('File load failed', { url, error: err.message })
      throw err
    }
  }

  async load(url, type) {
    const cached = this.cache.get(url)
    if (cached) return cached
    const loader = this.loaders.get(type)
    if (!loader) throw new Error(`No loader for type ${type}`)
    try {
      const asset = await loader(url)
      this.cache.set(url, asset)
      this.pruneCache()
      return asset
    } catch (err) {
      for (const fallback of this.fallbacks) {
        try {
          return await fallback(url, type, err)
        } catch (fallbackErr) {
          continue
        }
      }
      throw err
    }
  }

  pruneCache() {
    if (this.cache.size > this.maxCacheSize) {
      const entries = Array.from(this.cache.entries())
      entries.slice(0, entries.length - this.maxCacheSize).forEach(([key]) => {
        this.cache.delete(key)
      })
    }
  }

  clear() {
    this.cache.clear()
    this.files.clear()
  }
}
