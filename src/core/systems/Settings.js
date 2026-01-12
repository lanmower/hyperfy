import { System } from './System.js'
import { StateStore } from '../state/StateStore.js'
import { Ranks } from '../extras/ranks.js'

const DEFAULT_CONFIG = {
  title: null,
  desc: null,
  image: null,
  avatar: null,
  customAvatars: false,
  voice: 'spatial',
  rank: Ranks.VISITOR,
  playerLimit: 0,
  ao: true,
  hasAdminCode: false
}

export class Settings extends System {
  static DEPS = {
    events: 'events',
    network: 'network',
  }

  constructor(world) {
    super(world)
    this.state = new StateStore()
    for (const [k, v] of Object.entries(DEFAULT_CONFIG)) {
      this.state.set(k, v)
    }
  }

  get(key) { return this.state.get(key) }

  set(key, value, broadcast) {
    if (this.state.get(key) === value) return
    this.state.set(key, value)
    this.events.emit('settingChanged', { key, value })
    if (broadcast) this.network.send('settingsModified', { key, value })
  }

  setHasAdminCode(value) { this.state.set('hasAdminCode', value) }

  get effectiveRank() { return this.state.get('hasAdminCode') ? this.state.get('rank') : Ranks.ADMIN }

  deserialize(data) {
    if (!data || typeof data !== 'object') return
    for (const [key, value] of Object.entries(data)) {
      this.state.set(key, value)
    }
  }

  serialize() {
    const result = {}
    for (const key of Object.keys(DEFAULT_CONFIG)) {
      result[key] = this.state.get(key)
    }
    return result
  }

  get title() { return this.state.get('title') }
  set title(v) { this.set('title', v) }
  get desc() { return this.state.get('desc') }
  set desc(v) { this.set('desc', v) }
  get image() { return this.state.get('image') }
  set image(v) { this.set('image', v) }
  get avatar() { return this.state.get('avatar') }
  set avatar(v) { this.set('avatar', v) }
  get customAvatars() { return this.state.get('customAvatars') }
  set customAvatars(v) { this.set('customAvatars', v) }
  get voice() { return this.state.get('voice') }
  set voice(v) { this.set('voice', v) }
  get rank() { return this.state.get('rank') }
  set rank(v) { this.set('rank', v) }
  get playerLimit() { return this.state.get('playerLimit') }
  set playerLimit(v) { this.set('playerLimit', v) }
  get ao() { return this.state.get('ao') }
  set ao(v) { this.set('ao', v) }
  get hasAdminCode() { return this.state.get('hasAdminCode') }
  set hasAdminCode(v) { this.set('hasAdminCode', v) }
}
