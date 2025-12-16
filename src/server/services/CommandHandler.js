import { uuid } from '../../core/utils.js'
import { Ranks } from '../../core/extras/ranks.js'
import moment from 'moment'
import { serializeForNetwork } from '../../core/schemas/ChatMessage.schema.js'

export class CommandHandler {
  constructor(world, db) {
    this.world = world
    this.db = db
    this.setupCommandRegistry()
  }

  setupCommandRegistry() {
    this.commands = {
      'admin': this.admin.bind(this),
      'name': this.name.bind(this),
      'spawn': (socket, player, arg1) => this.world.network.onSpawnModified(socket, arg1),
      'chat': this.chat.bind(this),
      'server': this.server.bind(this),
    }
  }

  async execute(socket, args) {
    const player = socket.player
    const playerId = player.data.id
    const [cmd, arg1, arg2] = args

    const handler = this.commands[cmd]
    if (handler) {
      await handler(socket, player, arg1)
    }

    if (cmd !== 'admin') {
      this.world.events.emit('command', { playerId, args })
    }
  }

  async admin(socket, player, code) {
    if (!process.env.ADMIN_CODE || process.env.ADMIN_CODE !== code) return

    const id = player.data.id
    const userId = player.data.userId
    const granted = !player.isAdmin()
    const rank = granted ? Ranks.ADMIN : Ranks.VISITOR

    player.modify({ rank })
    this.world.network.send('entityModified', { id, rank })
    this.sendChat(socket, granted ? 'Admin granted!' : 'Admin revoked!')
    await this.db('users').where('id', userId).update({ rank })
  }

  async name(socket, player, name) {
    if (!name) return

    const id = player.data.id
    const userId = player.data.userId

    player.data.name = name
    player.modify({ name })
    this.world.network.send('entityModified', { id, name })
    this.sendChat(socket, `Name set to ${name}!`)
    await this.db('users').where('id', userId).update({ name })
  }

  chat(socket, player, op) {
    if (op === 'clear' && player.isBuilder()) {
      this.world.chat.clear(true)
    }
  }

  async server(socket, op) {
    if (op === 'stats') {
      const stats = await this.world.monitor.getStats()
      this.sendChat(socket, `CPU: ${stats.currentCPU.toFixed(3)}%`)
      this.sendChat(socket, `Memory: ${stats.currentMemory} / ${stats.maxMemory} MB (${((stats.currentMemory / stats.maxMemory) * 100).toFixed(1)}%)`)
    }
  }

  sendChat(socket, body) {
    const message = serializeForNetwork({
      id: uuid(),
      userId: 'system',
      name: 'System',
      text: body,
      timestamp: Date.now(),
      isSystem: true
    })
    socket.send('chatAdded', message)
  }
}
