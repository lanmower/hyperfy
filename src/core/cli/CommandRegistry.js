// Command Registry - unified CLI command system

import { Output } from './Output.js'
import { Metrics } from './Metrics.js'

export class CommandRegistry {
  constructor() {
    this.commands = new Map()
    this.aliases = new Map()
    this.groups = new Map()
    this.output = new Output('CLI')
    this.metrics = new Metrics('CLI')
  }

  register(name, handler, metadata = {}) {
    if (typeof handler !== 'function') {
      throw new Error(`Handler for command ${name} must be a function`)
    }

    const command = {
      name,
      handler,
      description: metadata.description || '',
      args: metadata.args || [],
      group: metadata.group || 'default',
      aliases: metadata.aliases || [],
      hidden: metadata.hidden || false
    }

    this.commands.set(name, command)

    for (const alias of command.aliases) {
      this.aliases.set(alias, name)
    }

    if (!this.groups.has(command.group)) {
      this.groups.set(command.group, [])
    }
    this.groups.get(command.group).push(name)

    this.metrics.counter(`commands.registered.${name}`)
    return this
  }

  registerBatch(commandMap) {
    for (const [name, config] of Object.entries(commandMap)) {
      const { handler, ...metadata } = config
      this.register(name, handler, metadata)
    }
    return this
  }

  async execute(input, context = {}) {
    const [rawName, ...args] = input.trim().split(/\s+/)
    const name = this.aliases.get(rawName) || rawName

    const command = this.commands.get(name)
    if (!command) {
      this.metrics.counter(`commands.failed.unknown`)
      throw new Error(`Unknown command: ${name}`)
    }

    this.metrics.counter(`commands.executed.${name}`)
    const timer = this.metrics.timer(`command.duration.${name}`)

    try {
      const result = await command.handler(args, context)
      timer()
      this.metrics.counter(`commands.success.${name}`)
      return { success: true, result, command: name }
    } catch (err) {
      timer()
      this.metrics.counter(`commands.error.${name}`)
      this.output.error(`Command failed: ${name}`, { error: err.message })
      return { success: false, error: err.message, command: name }
    }
  }

  get(name) {
    return this.commands.get(name) || this.commands.get(this.aliases.get(name))
  }

  list(group = null) {
    if (group) {
      return (this.groups.get(group) || []).map(name => this.commands.get(name))
    }
    return Array.from(this.commands.values())
  }

  help(commandName) {
    if (commandName) {
      const cmd = this.get(commandName)
      if (!cmd) return `Unknown command: ${commandName}`
      return this._formatCommand(cmd)
    }

    const byGroup = {}
    for (const [group, commands] of this.groups.entries()) {
      byGroup[group] = commands
        .map(name => this.commands.get(name))
        .filter(cmd => !cmd.hidden)
    }

    return this._formatHelp(byGroup)
  }

  _formatCommand(cmd) {
    let help = `${cmd.name}`
    if (cmd.aliases.length > 0) help += ` (${cmd.aliases.join(', ')})`
    if (cmd.description) help += `\n  ${cmd.description}`
    if (cmd.args.length > 0) {
      help += `\n  Arguments: ${cmd.args.join(', ')}`
    }
    return help
  }

  _formatHelp(byGroup) {
    let help = 'Available commands:\n'
    for (const [group, commands] of Object.entries(byGroup)) {
      if (commands.length === 0) continue
      help += `\n${group}:\n`
      for (const cmd of commands) {
        help += `  ${this._formatCommand(cmd)}\n`
      }
    }
    return help
  }

  stats() {
    return {
      total: this.commands.size,
      groups: this.groups.size,
      aliases: this.aliases.size,
      metrics: this.metrics.getStats()
    }
  }

  toString() {
    return `CommandRegistry(${this.commands.size} commands, ${this.groups.size} groups)`
  }
}
