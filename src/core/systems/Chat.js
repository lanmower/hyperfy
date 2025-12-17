import moment from 'moment'
import { uuid } from '../utils.js'
import { System } from './System.js'
import { StateManager } from '../state/StateManager.js'
import { normalizeMessage, serializeForNetwork, deserializeFromNetwork } from '../schemas/ChatMessage.schema.js'

export class Chat extends System {
  constructor(world) {
    super(world)
    this.state = new StateManager({ messages: [] })
  }

  getService(name) {
    if (this.world.di?.has?.(name)) {
      return this.world.di.get(name)
    }
    return this.world[name]
  }

  get entities() { return this.getService('entities') }
  get events() { return this.getService('events') }
  get network() { return this.getService('network') }
  get prefs() { return this.getService('prefs') }

  add(msg, broadcast) {
    if (!msg.id) msg.id = uuid()
    if (!msg.createdAt) msg.createdAt = moment().toISOString()

    const normalized = normalizeMessage(msg)

    const msgs = this.state.get('messages')
    const updated = [...msgs, msg]
    if (updated.length > 50) updated.shift()

    this.state.set('messages', updated)
    if (msg.fromId) this.entities.getPlayer(msg.fromId)?.chat(msg.body)
    this.events.emit('chat', Object.freeze({ ...msg }))
    if (broadcast) this.network.send('chatAdded', msg)
  }

  command(text) {
    if (this.network.isServer) return
    const args = text.slice(1).split(/\s+/).filter(Boolean)
    if (args[0] === 'stats') this.prefs.setStats(!this.prefs.stats)
    if (args[0] !== 'admin') this.events.emit('command', { playerId: this.network.id, args })
    this.network.send('command', args)
  }

  clear(broadcast) {
    this.state.set('messages', [])
    if (broadcast) this.network.send('chatCleared')
  }

  send(text) {
    if (!this.network.isClient) return
    const player = this.entities.player
    const msg = { id: uuid(), from: player.data.name, fromId: player.data.id, body: text, createdAt: moment().toISOString() }
    this.add(msg, true)
    return msg
  }

  serialize() { return this.state.get('messages') }
  deserialize(msgs) { this.state.set('messages', msgs) }
  subscribe(callback) {
    callback(this.state.get('messages'))
    return this.state.watch('messages', callback)
  }
}
