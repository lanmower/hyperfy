import { isBoolean, isNumber } from 'lodash-es'

import { System } from './System.js'
import { StateManager } from '../state/StateManager.js'
import { storage } from '../storage.js'
import { isTouch } from '../../client/utils.js'

export class ClientPrefs extends System {
  // DI Service Constants
  static DEPS = {
    events: 'events',
  }

  constructor(world) {
    super(world)

    const data = storage.get('prefs', {})

    if (!data.v) {
      data.v = 2
      data.ui = null
    }
    if (data.v < 3) {
      data.v = 3
      data.shadows = null
    }
    if (data.v < 4) {
      data.v = 4
      data.shadows = null
    }

    this.state = new StateManager({
      ui: isNumber(data.ui) ? data.ui : isTouch ? 0.9 : 1,
      actions: isBoolean(data.actions) ? data.actions : true,
      stats: isBoolean(data.stats) ? data.stats : false,
      dpr: isNumber(data.dpr) ? data.dpr : 1,
      shadows: data.shadows ? data.shadows : isTouch ? 'low' : 'med',
      postprocessing: isBoolean(data.postprocessing) ? data.postprocessing : true,
      bloom: isBoolean(data.bloom) ? data.bloom : true,
      ao: isBoolean(data.ao) ? data.ao : true,
      music: isNumber(data.music) ? data.music : 1,
      sfx: isNumber(data.sfx) ? data.sfx : 1,
      voice: isNumber(data.voice) ? data.voice : 1,
      v: data.v
    })
  }

  // DI Property Getters
  get events() { return this.getService(ClientPrefs.DEPS.events) }

  modify(key, value) {
    if (this.state.get(key) === value) return
    this.state.set(key, value)
    this.events.emit('prefChanged', { key, value })
    this.persist()
  }

  async persist() {
    await new Promise(resolve => setTimeout(resolve, 2000))
    storage.set('prefs', {
      ui: this.state.get('ui'),
      actions: this.state.get('actions'),
      stats: this.state.get('stats'),
      dpr: this.state.get('dpr'),
      shadows: this.state.get('shadows'),
      postprocessing: this.state.get('postprocessing'),
      bloom: this.state.get('bloom'),
      ao: this.state.get('ao'),
      music: this.state.get('music'),
      sfx: this.state.get('sfx'),
      voice: this.state.get('voice'),
      v: this.state.get('v')
    })
  }

  setUI(value) { this.modify('ui', value) }
  setActions(value) { this.modify('actions', value) }
  setStats(value) { this.modify('stats', value) }
  setDPR(value) { this.modify('dpr', value) }
  setShadows(value) { this.modify('shadows', value) }
  setPostprocessing(value) { this.modify('postprocessing', value) }
  setBloom(value) { this.modify('bloom', value) }
  setAO(value) { this.modify('ao', value) }
  setMusic(value) { this.modify('music', value) }
  setSFX(value) { this.modify('sfx', value) }
  setVoice(value) { this.modify('voice', value) }

  destroy() {}
}
