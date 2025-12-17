import * as THREE from '../extras/three.js'

import { System } from './System.js'
import { v } from '../utils/TempVectors.js'

const up = new THREE.Vector3(0, 1, 0)

export class ClientAudio extends System {
  static DEPS = {
    events: 'events',
    rig: 'rig',
    prefs: 'prefs',
  }

  constructor(world) {
    super(world)
    this.handles = new Set()
    this.ctx = new AudioContext() // new (window.AudioContext || window.webkitAudioContext)();
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
    if (!this.unlocked) {
      this.setupUnlockListener()
    }
    this.setupPrefRegistry()
  }

  setupPrefRegistry() {
    this.prefHandlers = {
      'music': (value) => {
        this.groupGains.music.gain.value = value
      },
      'sfx': (value) => {
        this.groupGains.sfx.gain.value = value
      },
      'voice': (value) => {
        this.groupGains.voice.gain.value = value
      },
    }
  }

  ready(fn) {
    if (this.unlocked) return fn()
    this.queue.push(fn)
  }

  setupUnlockListener() {
    const complete = () => {
      this.unlocked = true
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
      document.removeEventListener('keydown', unlock)
      while (this.queue.length) {
        this.queue.pop()()
      }
      console.log('[audio] unlocked')
    }
    const unlock = async () => {
      try {
        await this.ctx.resume()
        if (this.ctx.state !== 'running') throw new Error('Audio still suspended')
        const video = document.createElement('video')
        video.playsInline = true
        video.muted = true
        video.src = '/tiny.mp4'
        video
          .play()
          .then(() => {
            video.pause()
            video.remove()
            console.log('[audio] video played')
          })
          .catch(err => {
            console.log('[audio] video failed')
          })
      } catch (err) {
        console.error(err)
      } finally {
        complete()
      }
    }
    document.addEventListener('click', unlock)
    document.addEventListener('touchstart', unlock)
    document.addEventListener('keydown', unlock)
    console.log('[audio] suspended, waiting for interact...')
  }

  get events() { return this.getService(ClientAudio.DEPS.events) }
  get rig() { return this.getService(ClientAudio.DEPS.rig) }
  get prefs() { return this.getService(ClientAudio.DEPS.prefs) }

  async init() {
    this.events.on('prefChanged', this.onPrefChanged)
  }

  start() {
  }

  lateUpdate(delta) {
    const target = this.rig
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
    const handler = this.prefHandlers[key]
    if (handler) handler(value)
  }

  destroy() {
    this.groupGains.music.disconnect()
    this.groupGains.sfx.disconnect()
    this.groupGains.voice.disconnect()
    this.masterGain.disconnect()
    this.ctx.close()
    this.handles.clear()
    this.queue = []
  }
}
