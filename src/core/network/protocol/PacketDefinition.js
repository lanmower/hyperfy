import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('PacketDefinition')

export class PacketDefinition {
  static PROTOCOL_VERSION = 1

  static MESSAGE_TYPES = {
    snapshot: { id: 0, direction: 'both', handler: 'onSnapshot' },
    settingsModified: { id: 1, direction: 'client', handler: 'onSettingsModified' },
    chatAdded: { id: 2, direction: 'client', handler: 'onChatAdded' },
    chatCleared: { id: 3, direction: 'client', handler: 'onChatCleared' },
    blueprintAdded: { id: 4, direction: 'client', handler: 'onBlueprintAdded' },
    blueprintModified: { id: 5, direction: 'both', handler: 'onBlueprintModified' },
    entityAdded: { id: 6, direction: 'client', handler: 'onEntityAdded' },
    entityModified: { id: 7, direction: 'both', handler: 'onEntityModified' },
    entityEvent: { id: 8, direction: 'both', handler: 'onEntityEvent' },
    entityRemoved: { id: 9, direction: 'client', handler: 'onEntityRemoved' },
    playerTeleport: { id: 10, direction: 'client', handler: 'onPlayerTeleport' },
    playerPush: { id: 11, direction: 'client', handler: 'onPlayerPush' },
    playerSessionAvatar: { id: 12, direction: 'client', handler: 'onPlayerSessionAvatar' },
    liveKitLevel: { id: 13, direction: 'client', handler: 'onLiveKitLevel' },
    mute: { id: 14, direction: 'both', handler: 'onMute' },
    ping: { id: 15, direction: 'both', handler: 'onPing' },
    pong: { id: 16, direction: 'both', handler: 'onPong' },
    kick: { id: 17, direction: 'client', handler: 'onKick' },
    hotReload: { id: 18, direction: 'client', handler: 'onHotReload' },
    errors: { id: 19, direction: 'both', handler: 'onErrors' },
    fileUploadStart: { id: 20, direction: 'server', handler: 'onFileUploadStart' },
    fileUploadChunk: { id: 21, direction: 'server', handler: 'onFileUploadChunk' },
    fileUploadComplete: { id: 22, direction: 'server', handler: 'onFileUploadComplete' },
    fileUploadError: { id: 23, direction: 'client', handler: 'onFileUploadError' },
    command: { id: 24, direction: 'server', handler: 'onCommand' },
    modifyRank: { id: 25, direction: 'server', handler: 'onModifyRank' },
    errorEvent: { id: 26, direction: 'server', handler: 'onErrorEvent' },
    errorReport: { id: 27, direction: 'server', handler: 'onErrorReport' },
    clientError: { id: 28, direction: 'server', handler: 'onClientError' },
    mcpSubscribeErrors: { id: 29, direction: 'server', handler: 'onMcpSubscribeErrors' },
    getErrors: { id: 30, direction: 'server', handler: 'onGetErrors' },
    clearErrors: { id: 31, direction: 'server', handler: 'onClearErrors' },
  }

  static DIRECTIONS = {
    client: 'client',
    server: 'server',
    both: 'both',
  }

  static _entries = Object.entries(this.MESSAGE_TYPES)

  static getByName(name) {
    const def = this.MESSAGE_TYPES[name]
    if (!def) {
      logger.warn('Unknown message type', { name })
      return null
    }
    return {
      name,
      id: def.id,
      direction: def.direction,
      handler: def.handler,
      version: this.PROTOCOL_VERSION,
    }
  }

  static getById(id) {
    for (const [name, def] of this._entries) {
      if (def.id === id) {
        return {
          name,
          id: def.id,
          direction: def.direction,
          handler: def.handler,
          version: this.PROTOCOL_VERSION,
        }
      }
    }
    logger.warn('Unknown packet ID', { id })
    return null
  }

  static getAllByDirection(direction) {
    const messages = []
    for (const [name, def] of this._entries) {
      if (def.direction === direction || def.direction === 'both') {
        messages.push({
          name,
          id: def.id,
          direction: def.direction,
          handler: def.handler,
        })
      }
    }
    return messages
  }

  static validate(name, data) {
    const def = this.getByName(name)
    if (!def) {
      return {
        valid: false,
        error: `Unknown message type: ${name}`,
      }
    }

    if (data !== null && typeof data !== 'object') {
      return {
        valid: false,
        error: `Invalid data for ${name}: must be object or null`,
      }
    }

    return {
      valid: true,
      definition: def,
    }
  }

  static isValidDirection(name, isServer) {
    const def = this.getByName(name)
    if (!def) return false

    const targetDirection = isServer ? 'server' : 'client'
    return def.direction === targetDirection || def.direction === 'both'
  }

  static count() {
    return Object.keys(this.MESSAGE_TYPES).length
  }

  static getAll() {
    return this._entries.map(([name, def]) => ({
      name,
      ...def,
    }))
  }
}
