import { isBoolean, isNumber } from '../utils/helpers/typeChecks.js'

import { System } from './System.js'
import { StateStore } from '../state/StateStore.js'
import { storage } from '../storage.js'
import { isTouch } from '../../client/utils.js'

export class ClientPrefs extends System {
  static DEPS = {
    events: 'events',
  }

  constructor(world) {
    super(world)
    this.persistTimer = null

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

    this.state = new StateStore()
    this.state.set('ui', isNumber(data.ui) ? data.ui : isTouch ? 0.9 : 1)
    this.state.set('actions', isBoolean(data.actions) ? data.actions : true)
    this.state.set('stats', isBoolean(data.stats) ? data.stats : false)
    this.state.set('dpr', isNumber(data.dpr) ? data.dpr : 1)
    this.state.set('shadows', data.shadows ? data.shadows : isTouch ? 'low' : 'med')
    this.state.set('postprocessing', isBoolean(data.postprocessing) ? data.postprocessing : true)
    this.state.set('bloom', isBoolean(data.bloom) ? data.bloom : true)
    this.state.set('ao', isBoolean(data.ao) ? data.ao : true)
    this.state.set('music', isNumber(data.music) ? data.music : 1)
    this.state.set('sfx', isNumber(data.sfx) ? data.sfx : 1)
    this.state.set('voice', isNumber(data.voice) ? data.voice : 1)
    this.state.set('v', data.v)
  }

  modify(key, value) {
    if (this.state.get(key) === value) return
    this.state.set(key, value)
    this.events.emit('prefChanged', { key, value })
    this.persist()
  }

  async persist() {
    if (this.persistTimer) clearTimeout(this.persistTimer)
    this.persistTimer = setTimeout(() => {
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
      this.persistTimer = null
    }, 2000)
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

  destroy() {
    if (this.persistTimer) clearTimeout(this.persistTimer)
  }
}
