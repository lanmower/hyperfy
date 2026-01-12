import { uuid } from '../../core/utils.js'
import { Ranks } from '../../core/extras/ranks.js'
import moment from 'moment'
import { serializeForNetwork } from '../../core/schemas/ChatMessage.schema.js'
import { LoggerFactory } from '../../core/utils/logging/index.js'
import { MasterConfig } from '../config/MasterConfig.js'
import { TTLMap } from '../utils/collections/TTLMap.js'

const logger = LoggerFactory.get('CommandHandler')

const MAX_ADMIN_ATTEMPTS = MasterConfig.security.maxAdminAttempts
const ADMIN_LOCKOUT_TIME = MasterConfig.security.adminLockoutTime
const adminAttempts = new TTLMap(ADMIN_LOCKOUT_TIME)

function checkAdminAttempts(clientIP) {
  const now = Date.now()
  if (!adminAttempts.has(clientIP)) {
    adminAttempts.set(clientIP, { attempts: 0, lockedUntil: 0 }, ADMIN_LOCKOUT_TIME)
  }

  const record = adminAttempts.get(clientIP)
  if (record.lockedUntil > now) {
    return false
  }

  record.attempts += 1
  if (record.attempts >= MAX_ADMIN_ATTEMPTS) {
    record.lockedUntil = now + ADMIN_LOCKOUT_TIME
    record.attempts = 0
    return false
  }

  return true
}

function resetAdminAttempts(clientIP) {
  adminAttempts.delete(clientIP)
}

const ALLOWED_COMMANDS = new Set(['admin', 'name', 'spawn', 'chat', 'server'])

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

  validateCommand(args) {
    if (!Array.isArray(args)) {
      logger.error('Command args is not array', { received: typeof args })
      return { valid: false, error: 'Invalid command structure' }
    }

    if (!args.length) {
      logger.error('Empty command received', {})
      return { valid: false, error: 'Empty command' }
    }

    const [cmd] = args

    if (typeof cmd !== 'string') {
      logger.error('Command method is not string', { received: typeof cmd, value: cmd })
      return { valid: false, error: 'Invalid command type' }
    }

    if (!ALLOWED_COMMANDS.has(cmd)) {
      logger.error('Unknown command method', { command: cmd })
      return { valid: false, error: 'Unknown command' }
    }

    return { valid: true }
  }

  async execute(socket, args) {
    const validation = this.validateCommand(args)
    if (!validation.valid) {
      logger.error('Command validation failed', {
        error: validation.error,
        socketId: socket.id,
        argsLength: args?.length
      })
      return
    }

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
    const clientIP = socket.ws?.remoteAddress || 'unknown'

    if (!process.env.ADMIN_CODE) {
      this.sendChat(socket, 'Admin code not configured')
      return
    }

    if (!checkAdminAttempts(clientIP)) {
      logger.warn('Admin code brute-force attempt blocked', { clientIP })
      this.sendChat(socket, 'Admin code attempts locked. Try again later.')
      return
    }

    if (process.env.ADMIN_CODE !== code) {
      logger.warn('Failed admin code attempt', { clientIP })
      this.sendChat(socket, 'Invalid admin code')
      return
    }

    resetAdminAttempts(clientIP)
    const id = player.data.id
    const userId = player.data.userId
    const granted = !player.isAdmin()
    const rank = granted ? Ranks.ADMIN : Ranks.VISITOR

    logger.info('Admin privilege modified', { playerName: player.data.name, userId, granted, action: granted ? 'granted' : 'revoked' })
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
    this.sendChat(socket, 'Name set to ' + name + '!')
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
      this.sendChat(socket, 'CPU: ' + stats.currentCPU.toFixed(3) + '%')
      const percent = ((stats.currentMemory / stats.maxMemory) * 100).toFixed(1)
      this.sendChat(socket, 'Memory: ' + stats.currentMemory + ' / ' + stats.maxMemory + ' MB (' + percent + '%)')
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
