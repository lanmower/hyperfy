import { System } from './System.js'
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
  constructor(world) {
    super(world)
    this.config = { ...DEFAULT_CONFIG }
    this.changes = null
  }

  get(key) { return this.config[key] }

  set(key, value, broadcast) {
    if (this.config[key] === value) return
    const prev = this.config[key]
    this.config[key] = value
    if (!this.changes) this.changes = {}
    this.changes[key] = { prev, value }
    if (broadcast) this.world.network.send('settingsModified', { key, value })
  }

  setHasAdminCode(value) { this.config.hasAdminCode = value }

  get effectiveRank() { return this.config.hasAdminCode ? this.config.rank : Ranks.ADMIN }

  deserialize(data) {
    this.config = { ...this.config, ...data }
    const changeMap = {}
    for (const [key, value] of Object.entries(data)) changeMap[key] = { value }
    this.emit('change', changeMap)
  }

  serialize() { return { ...this.config } }

  preFixedUpdate() {
    if (!this.changes) return
    const changeMap = {}
    for (const [key, value] of Object.entries(this.changes)) changeMap[key] = { value: value.value }
    this.emit('change', changeMap)
    this.changes = null
  }

  get title() { return this.config.title }
  set title(v) { this.set('title', v) }
  get desc() { return this.config.desc }
  set desc(v) { this.set('desc', v) }
  get image() { return this.config.image }
  set image(v) { this.set('image', v) }
  get avatar() { return this.config.avatar }
  set avatar(v) { this.set('avatar', v) }
  get customAvatars() { return this.config.customAvatars }
  set customAvatars(v) { this.set('customAvatars', v) }
  get voice() { return this.config.voice }
  set voice(v) { this.set('voice', v) }
  get rank() { return this.config.rank }
  set rank(v) { this.set('rank', v) }
  get playerLimit() { return this.config.playerLimit }
  set playerLimit(v) { this.set('playerLimit', v) }
  get ao() { return this.config.ao }
  set ao(v) { this.set('ao', v) }
  get hasAdminCode() { return this.config.hasAdminCode }
  set hasAdminCode(v) { this.config.hasAdminCode = v }
}
