import { System } from './System.js'
import { AudioContextSetup } from './audio/AudioContextSetup.js'
import { AudioListenerController } from './audio/AudioListenerController.js'

export class ClientAudio extends System {
  static DEPS = {
    events: 'events',
    rig: 'rig',
    prefs: 'prefs',
  }

  static EVENTS = {
    prefChanged: 'onPrefChanged',
  }

  constructor(world) {
    super(world)
    this.handles = new Set()
    const { ctx, masterGain, groupGains, listener } = AudioContextSetup.createContext(this.prefs)
    this.ctx = ctx
    this.masterGain = masterGain
    this.groupGains = groupGains
    this.listener = listener
    this.lastDelta = 0
    this.queue = []
    this.unlocked = this.ctx.state !== 'suspended'
    if (!this.unlocked) {
      AudioContextSetup.setupUnlockListener(this.ctx, this.queue, () => {
        this.unlocked = true
      })
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

  async init() {
  }

  start() {
  }

  lateUpdate(delta) {
    AudioListenerController.update(this.listener, this.rig, delta, this.ctx)
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
