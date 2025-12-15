import moment from 'moment'
import { uuid } from '../utils.js'
import { System } from './System.js'
import { ListenerMixin } from '../mixins/ListenerMixin.js'

const CHAT_MAX_MESSAGES = 50

export class Chat extends ListenerMixin(System) {
  constructor(world) {
    super(world)
    this.msgs = []
  }

  add(msg, broadcast) {
    if (!msg.id) msg.id = uuid()
    if (!msg.createdAt) moment().toISOString()
    this.msgs = [...this.msgs, msg]
    if (this.msgs.length > CHAT_MAX_MESSAGES) {
      this.msgs.shift()
    }
    this.notifyListeners(this.msgs)
    if (msg.fromId) {
      const player = this.world.entities.getPlayer(msg.fromId)
      player?.chat(msg.body)
    }
    // emit chat event
    const readOnly = Object.freeze({ ...msg })
    this.world.events.emit('chat', readOnly)
    // maybe broadcast
    if (broadcast) {
      this.world.network.send('chatAdded', msg)
    }
  }

  command(text) {
    if (this.world.network.isServer) return
    const playerId = this.world.network.id
    const args = text
      .slice(1)
      .split(' ')
      .map(str => str.trim())
      .filter(str => !!str)
    const isAdminCommand = args[0] === 'admin'
    if (args[0] === 'stats') {
      this.world.prefs.setStats(!this.world.prefs.stats)
    }
    if (!isAdminCommand) {
      this.world.events.emit('command', { playerId, args })
    }
    this.world.network.send('command', args)
  }

  clear(broadcast) {
    this.msgs = []
    this.notifyListeners(this.msgs)
    if (broadcast) {
      this.world.network.send('chatCleared')
    }
  }

  send(text) {
    // only available as a client
    if (!this.world.network.isClient) return
    const player = this.world.entities.player
    const data = {
      id: uuid(),
      from: player.data.name,
      fromId: player.data.id,
      body: text,
      createdAt: moment().toISOString(),
    }
    this.add(data, true)
    return data
  }

  serialize() {
    return this.msgs
  }

  deserialize(msgs) {
    this.msgs = msgs
    this.notifyListeners(msgs)
  }

  subscribe(callback) {
    callback(this.msgs)
    return this.addListener(callback)
  }
}
