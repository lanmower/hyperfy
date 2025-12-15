import moment from 'moment'
import { uuid } from '../utils.js'
import { System } from './System.js'
import { StateManager } from '../state/StateManager.js'

export class Chat extends System {
  constructor(world) {
    super(world)
    this.state = new StateManager({ messages: [] })
  }

  add(msg, broadcast) {
    if (!msg.id) msg.id = uuid()
    if (!msg.createdAt) msg.createdAt = moment().toISOString()

    const msgs = this.state.get('messages')
    const updated = [...msgs, msg]
    if (updated.length > 50) updated.shift()

    this.state.set('messages', updated)
    if (msg.fromId) this.world.entities.getPlayer(msg.fromId)?.chat(msg.body)
    this.world.events.emit('chat', Object.freeze({ ...msg }))
    if (broadcast) this.world.network.send('chatAdded', msg)
  }

  command(text) {
    if (this.world.network.isServer) return
    const args = text.slice(1).split(/\s+/).filter(Boolean)
    if (args[0] === 'stats') this.world.prefs.setStats(!this.world.prefs.stats)
    if (args[0] !== 'admin') this.world.events.emit('command', { playerId: this.world.network.id, args })
    this.world.network.send('command', args)
  }

  clear(broadcast) {
    this.state.set('messages', [])
    if (broadcast) this.world.network.send('chatCleared')
  }

  send(text) {
    if (!this.world.network.isClient) return
    const player = this.world.entities.player
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
