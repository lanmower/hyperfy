import { StructuredLogger } from './utils/logging/index.js'

const logger = new StructuredLogger('FeatureDetector')

export class FeatureDetector {
  constructor() {
    this.features = {}
    this.detectionComplete = false
  }

  async detect() {
    if (this.detectionComplete) return this.features

    this.features = {
      webgl: this.detectWebGL(),
      webgl2: this.detectWebGL2(),
      webAudio: this.detectWebAudio(),
      webSocket: this.detectWebSocket(),
      webRTC: this.detectWebRTC(),
      webWorker: this.detectWebWorker(),
      indexedDB: this.detectIndexedDB(),
      localStorage: this.detectLocalStorage(),
      fetch: this.detectFetch(),
      audioContext: await this.detectAudioContext(),
      microphone: await this.detectMicrophone(),
      camera: await this.detectCamera(),
      gamepad: this.detectGamepad(),
      pointerLock: this.detectPointerLock(),
      fullscreen: this.detectFullscreen(),
      webXR: await this.detectWebXR(),
      offscreenCanvas: this.detectOffscreenCanvas(),
    }

    this.detectionComplete = true
    logger.info('Detection complete', { features: Object.keys(this.features) })
    return this.features
  }

  detectWebGL() {
    try {
      const canvas = document.createElement('canvas')
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    } catch (e) {
      return false
    }
  }

  detectWebGL2() {
    try {
      const canvas = document.createElement('canvas')
      return !!canvas.getContext('webgl2')
    } catch (e) {
      return false
    }
  }

  detectWebAudio() {
    return !!(window.AudioContext || window.webkitAudioContext)
  }

  detectWebSocket() {
    return typeof WebSocket !== 'undefined'
  }

  detectWebRTC() {
    return !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection)
  }

  detectWebWorker() {
    return typeof Worker !== 'undefined'
  }

  detectIndexedDB() {
    return !!(window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB)
  }

  detectLocalStorage() {
    try {
      const test = '__test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  }

  detectFetch() {
    return typeof fetch !== 'undefined'
  }

  async detectAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return false
      const ctx = new AudioContextClass()
      await ctx.close()
      return true
    } catch (e) {
      return false
    }
  }

  async detectMicrophone() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (e) {
      return false
    }
  }

  async detectCamera() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (e) {
      return false
    }
  }

  detectGamepad() {
    return !!(navigator.getGamepads || navigator.webkitGetGamepads)
  }

  detectPointerLock() {
    const el = document.createElement('div')
    return !!(el.requestPointerLock || el.mozRequestPointerLock || el.webkitRequestPointerLock)
  }

  detectFullscreen() {
    const el = document.createElement('div')
    return !!(el.requestFullscreen || el.mozRequestFullScreen || el.webkitRequestFullscreen || el.msRequestFullscreen)
  }

  async detectWebXR() {
    try {
      if (!navigator.xr) return false
      const supported = await navigator.xr.isSessionSupported('immersive-vr')
      return supported
    } catch (e) {
      return false
    }
  }

  detectOffscreenCanvas() {
    return typeof OffscreenCanvas !== 'undefined'
  }

  getFeatures() {
    return this.features
  }

  hasFeature(feature) {
    return !!this.features[feature]
  }

  getCapabilities() {
    return {
      canUseAudio: this.features.webAudio && this.features.audioContext,
      canUseVoiceChat: this.features.webRTC && this.features.microphone,
      canUseVideoChat: this.features.webRTC && this.features.camera,
      canUsePhysics: this.features.webWorker,
      canUseWebSocket: this.features.webSocket,
      canUseStorage: this.features.indexedDB || this.features.localStorage,
      canUseXR: this.features.webXR,
      canUseGamepad: this.features.gamepad,
      canUsePointerLock: this.features.pointerLock,
      canUseFullscreen: this.features.fullscreen,
      canRender3D: this.features.webgl || this.features.webgl2,
    }
  }
}
