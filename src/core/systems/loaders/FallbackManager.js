import * as THREE from '../../extras/three.js'
import { createNode } from '../../extras/createNode.js'
import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('FallbackManager')

export class FallbackManager {
  constructor() {
    this.fallbacks = new Map()
    this.usageLog = []
    this.createFallbacks()
  }

  createFallbacks() {
    this.fallbacks.set('model', this.createPlaceholderModel())
    this.fallbacks.set('texture', this.createPlaceholderTexture())
    this.fallbacks.set('audio', this.createPlaceholderAudio())
    this.fallbacks.set('script', this.createPlaceholderScript())
    this.fallbacks.set('hdr', this.createPlaceholderHDR())
    this.fallbacks.set('avatar', this.createPlaceholderAvatar())
    this.fallbacks.set('emote', this.createPlaceholderEmote())
    this.fallbacks.set('image', this.createPlaceholderImage())
    this.fallbacks.set('video', this.createPlaceholderVideo())
  }

  createPlaceholderModel() {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.8,
      metalness: 0.2
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = 'placeholder_model'

    const scene = new THREE.Group()
    scene.add(mesh)

    const node = createNode('group', { id: '$root' })

    return {
      toNodes() {
        return node.clone(true)
      },
      getScene() {
        return scene.clone()
      },
      getStats() {
        return {
          triangles: 12,
          meshes: 1,
          fileBytes: 0,
          isFallback: true
        }
      },
    }
  }

  createPlaceholderTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 64, 64)
    const texture = new THREE.CanvasTexture(canvas)
    texture.name = 'placeholder_texture'
    return texture
  }

  createPlaceholderAudio() {
    const sampleRate = 44100
    const duration = 0.1
    const audioBuffer = new AudioBuffer({
      length: sampleRate * duration,
      numberOfChannels: 1,
      sampleRate: sampleRate
    })
    const channelData = audioBuffer.getChannelData(0)
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = 0
    }
    return audioBuffer
  }

  createPlaceholderScript() {
    return {
      exec: () => {},
      isFallback: true
    }
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
    texture.name = 'placeholder_hdr'
    return texture
  }

  createPlaceholderAvatar() {
    const geometry = new THREE.CapsuleGeometry(0.3, 1.2, 8, 16)
    const material = new THREE.MeshStandardMaterial({ color: 0x808080 })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = 'placeholder_avatar'

    const node = createNode('group', { id: '$root' })

    return {
      factory: {
        raw: { scene: mesh },
        isFallback: true
      },
      hooks: null,
      toNodes() {
        return node.clone(true)
      },
      getStats() {
        return {
          triangles: 128,
          meshes: 1,
          fileBytes: 0,
          isFallback: true
        }
      },
    }
  }

  createPlaceholderEmote() {
    return {
      toClip: () => null,
      isFallback: true
    }
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
    return {
      create: () => {
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 64
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, 64, 64)
        const texture = new THREE.CanvasTexture(canvas)
        texture.name = 'placeholder_video'
        return {
          texture,
          dispose: () => {},
          isFallback: true
        }
      },
      isFallback: true
    }
  }

  getFallback(type, url, error) {
    const fallback = this.fallbacks.get(type)
    if (fallback) {
      this.logFallback(type, url, error)
      return fallback
    }
    return null
  }

  logFallback(type, url, error) {
    const entry = {
      type,
      url,
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }
    this.usageLog.push(entry)
    logger.warn('Using fallback resource', { type, url, error: entry.error })
  }

  getUsageLog() {
    return this.usageLog
  }

  clearLog() {
    this.usageLog = []
  }
}
