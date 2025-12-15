import { uuid } from '../../core/utils.js'
import { Ranks } from '../../core/extras/ranks.js'
import moment from 'moment'
import { serializeForNetwork } from '../../core/schemas/ChatMessage.schema.js'

export class CommandHandler {
  constructor(world, db) {
    this.world = world
    this.db = db
  }

  async execute(socket, args) {
    const player = socket.player
    const playerId = player.data.id
    const [cmd, arg1, arg2] = args

    if (cmd === 'admin') {
      await this.admin(socket, player, arg1)
    } else if (cmd === 'name') {
      await this.name(socket, player, arg1)
    } else if (cmd === 'spawn') {
      this.world.network.onSpawnModified(socket, arg1)
    } else if (cmd === 'chat') {
      this.chat(socket, player, arg1)
    } else if (cmd === 'server') {
      await this.server(socket, arg1)
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
