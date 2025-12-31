import { StructuredLogger } from '../../utils/logging/index.js'

export class BaseBuilderHandler {
  constructor(parent, componentName) {
    this.parent = parent
    this.logger = new StructuredLogger(componentName)
    this._commands = new Map()
  }

  registerCommand(name, handler, schema, eventName) {
    this._commands.set(name, { handler: handler.bind(this), schema, eventName })
  }

  async executeCommand(commandName, data) {
    const cmd = this._commands.get(commandName)
    if (!cmd) {
      throw new Error(`Unknown command: ${commandName}`)
    }

    try {
      if (cmd.schema) {
        cmd.schema.parse(data)
      }

      const result = await cmd.handler(data)
      if (cmd.eventName) {
        this.emitEvent(cmd.eventName, result)
      }
      return result
    } catch (err) {
      this.logger.error(`${commandName} failed`, { error: err.message })
      throw err
    }
  }

  validateCommand(command, rules) {
    for (const [key, validate] of Object.entries(rules)) {
      if (!validate(command[key])) {
        const error = new Error(`Invalid ${key}`)
        this.logger.error('Validation failed', { command, rule: key })
        throw error
      }
    }
  }

  emitEvent(eventName, data) {
    const events = this.parent.clientBuilder?.events || this.parent.events
    if (events) {
      events.emit(eventName, data)
    }
  }

  sendNetwork(messageType, payload) {
    const network = this.parent.clientBuilder?.network || this.parent.network
    if (network) {
      network.send(messageType, payload)
    }
  }
}
