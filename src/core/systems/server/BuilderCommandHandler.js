import { uuid } from '../../utils.js'
import { serializeForNetwork } from '../../schemas/ChatMessage.schema.js'
import { StructuredLogger } from '../../utils/logging/index.js'
import { BuilderCommandParser } from './BuilderCommandParser.js'

const logger = new StructuredLogger('BuilderCommandHandler')

export class BuilderCommandHandler {
  constructor(serverNetwork) {
    this.serverNetwork = serverNetwork
    this.parser = new BuilderCommandParser(serverNetwork)
  }

  onBlueprintAdded(socket, blueprint) {
    const result = this.parser.parseBlueprint(socket, blueprint)
    if (!result.valid) {
      this.sendValidationError(socket, result)
      return
    }
    this.serverNetwork.blueprints.add(blueprint)
    this.serverNetwork.send('blueprintAdded', blueprint, socket.id)
    this.serverNetwork.dirtyBlueprints.add(blueprint.id)
  }

  onBlueprintModified(socket, data) {
    const result = this.parser.parseBlueprint(socket, data)
    if (!result.valid) {
      this.sendValidationError(socket, result)
      return
    }
    const blueprint = this.serverNetwork.blueprints.get(data.id)
    if (data.version > blueprint.version) {
      this.serverNetwork.blueprints.modify(data)
      this.serverNetwork.send('blueprintModified', data, socket.id)
      this.serverNetwork.dirtyBlueprints.add(data.id)
    } else {
      socket.send('blueprintModified', blueprint)
    }
  }

  onEntityAdded(socket, data) {
    const result = this.parser.parseEntity(socket, data)
    if (!result.valid) {
      this.sendValidationError(socket, result)
      return
    }
    const entity = this.serverNetwork.entities.add(data)
    this.serverNetwork.send('entityAdded', data, socket.id)
    if (entity.isApp) this.serverNetwork.dirtyApps.add(entity.data.id)
  }

  async onEntityModified(socket, data) {
    const result = this.parser.parseEntityModification(socket, data)
    if (!result.valid) {
      this.sendValidationError(socket, result)
      return
    }
    const entity = result.entity
    entity.modify(data)
    this.serverNetwork.send('entityModified', data, socket.id)
    if (entity.isApp) {
      this.serverNetwork.dirtyApps.add(entity.data.id)
    }
    if (entity.isPlayer) {
      const changes = {}
      let changed
      if (data.hasOwnProperty('name')) {
        changes.name = data.name
        changed = true
      }
      if (data.hasOwnProperty('avatar')) {
        changes.avatar = data.avatar
        changed = true
      }
      if (changed) {
        await this.serverNetwork.persistence.updateUserData(entity.data.userId, changes)
      }
    }
  }

  onEntityRemoved(socket, id) {
    if (!socket.player.isBuilder()) {
      logger.error('player attempted to remove entity without builder permission')
      return
    }
    const entity = this.serverNetwork.entities.get(id)
    this.serverNetwork.entities.remove(id)
    this.serverNetwork.send('entityRemoved', id, socket.id)
    if (entity && entity.isApp) this.serverNetwork.dirtyApps.add(id)
  }

  onSettingsModified(socket, data) {
    const result = this.parser.parseSettings(socket, data)
    if (!result.valid) {
      this.sendValidationError(socket, result)
      return
    }
    this.serverNetwork.settings.set(data.key, data.value)
    this.serverNetwork.send('settingsModified', data, socket.id)
  }

  async onSpawnModified(socket, op) {
    const result = this.parser.parseSpawn(socket, op)
    if (!result.valid) {
      this.sendValidationError(socket, result)
      return
    }
    const player = socket.player
    if (op === 'set') {
      this.serverNetwork.spawn = { position: player.data.position.slice(), quaternion: player.data.quaternion.slice() }
    } else if (op === 'clear') {
      this.serverNetwork.spawn = { position: [0, 0, 0], quaternion: [0, 0, 0, 1] }
    }
    const data = JSON.stringify(this.serverNetwork.spawn)
    await this.serverNetwork.persistence.setConfig('spawn', data)
    const message = serializeForNetwork({
      id: uuid(),
      userId: 'system',
      name: 'System',
      text: op === 'set' ? 'Spawn updated' : 'Spawn cleared',
      timestamp: Date.now(),
      isSystem: true
    })
    socket.send('chatAdded', message)
  }

  onEntityEvent(socket, event) {
    const result = this.parser.parseEvent(socket, event)
    if (!result.valid) return
    const entity = result.entity
    entity.onEvent(result.version, result.name, result.data, result.socketId)
  }

  sendValidationError(socket, result) {
    if (result.error === 'permission') {
      socket.send('error', { message: 'Permission denied' })
    } else if (result.error === 'validation') {
      socket.send('error', {
        message: 'Validation failed',
        violations: result.violations,
      })
    } else if (result.error === 'ownership') {
      socket.send('error', { message: 'You do not own this entity' })
    } else if (result.error === 'not_found') {
      socket.send('error', { message: 'Entity not found' })
    } else if (result.error === 'invalid_op') {
      socket.send('error', { message: 'Invalid operation' })
    }
  }
}
