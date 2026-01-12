import * as THREE from '../extras/three.js'
import { System } from './System.js'
import { v } from '../utils/TempVectors.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('ClientAudio')

const up = new THREE.Vector3(0, 1, 0)

export class ClientAudio extends System {
  static DEPS = {
    events: 'events',
    prefs: 'prefs',
  }

  static EVENTS = {
    prefChanged: 'onPrefChanged',
  }

  constructor(world) {
    super(world)
    this.handles = new Set()
    this.degraded = false

    const capabilities = world.capabilities
    if (capabilities && !capabilities.canUseAudio) {
      logger.warn('Web Audio API unavailable - audio disabled')
      this.degraded = true
      this.ctx = null
      this.masterGain = null
      this.groupGains = {}
      this.listener = null
      this.lastDelta = 0
      this.queue = []
      this.unlocked = false
      return
    }

    try {
      this.ctx = new AudioContext()
      this.masterGain = this.ctx.createGain()
      this.masterGain.connect(this.ctx.destination)
      this.groupGains = {
        music: this.ctx.createGain(),
        sfx: this.ctx.createGain(),
        voice: this.ctx.createGain(),
      }
      this.groupGains.music.gain.value = this.prefs.state.get('music')
      this.groupGains.sfx.gain.value = this.prefs.state.get('sfx')
      this.groupGains.voice.gain.value = this.prefs.state.get('voice')
      this.groupGains.music.connect(this.masterGain)
      this.groupGains.sfx.connect(this.masterGain)
      this.groupGains.voice.connect(this.masterGain)
      this.listener = this.ctx.listener
      this.listener.positionX.value = 0
      this.listener.positionY.value = 0
      this.listener.positionZ.value = 0
      this.listener.forwardX.value = 0
      this.listener.forwardY.value = 0
      this.listener.forwardZ.value = -1
      this.listener.upX.value = 0
      this.listener.upY.value = 1
      this.listener.upZ.value = 0
      this.lastDelta = 0
      this.queue = []
      this.unlocked = this.ctx.state !== 'suspended'
      this.unlockedHandlers = {}
      if (!this.unlocked) {
        const complete = () => {
          this.unlocked = true
          document.removeEventListener('click', this.unlockedHandlers.unlock)
          document.removeEventListener('touchstart', this.unlockedHandlers.unlock)
          document.removeEventListener('keydown', this.unlockedHandlers.unlock)
          while (this.queue.length) {
            this.queue.pop()()
          }
        }
        this.unlockedHandlers.unlock = async () => {
          try {
            await this.ctx.resume()
            if (this.ctx.state !== 'running') throw new Error('Audio still suspended')
            const video = document.createElement('video')
            video.playsInline = true
            video.muted = true
            video.src = '/tiny.mp4'
            video.play().then(() => {
              video.pause()
              video.remove()
            }).catch((err) => {
              logger.error('Failed to unlock audio context', { error: err.message })
            })
          } catch (err) {
            logger.error('Audio context resume error', { error: err.message })
          } finally {
            complete()
          }
        }
        document.addEventListener('click', this.unlockedHandlers.unlock)
        document.addEventListener('touchstart', this.unlockedHandlers.unlock)
        document.addEventListener('keydown', this.unlockedHandlers.unlock)
      }
    } catch (err) {
      logger.error('Failed to initialize AudioContext', { error: err.message })
      this.degraded = true
      this.ctx = null
      this.masterGain = null
      this.groupGains = {}
      this.listener = null
      this.lastDelta = 0
      this.queue = []
      this.unlocked = false
    }
  }

  ready(fn) {
    if (this.degraded) return
    if (this.unlocked) return fn()
    this.queue.push(fn)
  }

  lateUpdate(delta) {
    if (this.degraded || !this.listener) return
    const target = this.world.cameraController?.camera
    if (!target) return
    const dir = v[0].set(0, 0, -1).applyQuaternion(target.quaternion)
    if (this.listener.positionX) {
      const endTime = this.ctx.currentTime + delta * 2
      this.listener.positionX.linearRampToValueAtTime(target.position.x, endTime)
      this.listener.positionY.linearRampToValueAtTime(target.position.y, endTime)
      this.listener.positionZ.linearRampToValueAtTime(target.position.z, endTime)
      this.listener.forwardX.linearRampToValueAtTime(dir.x, endTime)
      this.listener.forwardY.linearRampToValueAtTime(dir.y, endTime)
      this.listener.forwardZ.linearRampToValueAtTime(dir.z, endTime)
      this.listener.upX.linearRampToValueAtTime(up.x, endTime)
      this.listener.upY.linearRampToValueAtTime(up.y, endTime)
      this.listener.upZ.linearRampToValueAtTime(up.z, endTime)
    } else {
      this.listener.setPosition(target.position.x, target.position.y, target.position.z)
      this.listener.setOrientation(dir.x, dir.y, dir.z, up.x, up.y, up.z)
    }
    this.lastDelta = delta * 2
  }

  onPrefChanged = ({ key, value }) => {
    if (key === 'music') {
      this.groupGains.music.gain.value = value
    } else if (key === 'sfx') {
      this.groupGains.sfx.gain.value = value
    } else if (key === 'voice') {
      this.groupGains.voice.gain.value = value
    }
  }

  destroy() {
    if (this.unlockedHandlers?.unlock) {
      document.removeEventListener('click', this.unlockedHandlers.unlock)
      document.removeEventListener('touchstart', this.unlockedHandlers.unlock)
      document.removeEventListener('keydown', this.unlockedHandlers.unlock)
    }
    if (!this.degraded) {
      this.groupGains.music.disconnect()
      this.groupGains.sfx.disconnect()
      this.groupGains.voice.disconnect()
      this.masterGain.disconnect()
      this.ctx.close()
    }
    this.handles.clear()
    this.queue = []
  }
}
