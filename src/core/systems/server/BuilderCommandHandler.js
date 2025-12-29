import { uuid } from '../../utils.js'
import { serializeForNetwork } from '../../schemas/ChatMessage.schema.js'
import { ScriptValidator } from '../../../server/security/ScriptValidator.js'
import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('BuilderCommandHandler')

export class BuilderCommandHandler {
  constructor(serverNetwork) {
    this.serverNetwork = serverNetwork
  }

  onBlueprintAdded(socket, blueprint) {
    if (!socket.player.isBuilder()) {
      logger.error('player attempted to add blueprint without builder permission')
      return
    }

    const validation = ScriptValidator.validateBlueprint(blueprint, {
      userId: socket.player.data.userId,
      blueprintId: blueprint.id,
    })

    if (!validation.valid) {
      logger.error('Blueprint validation failed', {
        blueprintId: blueprint.id,
        userId: socket.player.data.userId,
        violations: validation.violations,
      })
      socket.send('error', {
        message: 'Blueprint validation failed',
        violations: validation.violations,
      })
      return
    }

    this.serverNetwork.blueprints.add(blueprint)
    this.serverNetwork.send('blueprintAdded', blueprint, socket.id)
    this.serverNetwork.dirtyBlueprints.add(blueprint.id)
  }

  onBlueprintModified(socket, data) {
    if (!socket.player.isBuilder()) {
      logger.error('player attempted to modify blueprint without builder permission')
      return
    }

    const validation = ScriptValidator.validateBlueprint(data, {
      userId: socket.player.data.userId,
      blueprintId: data.id,
    })

    if (!validation.valid) {
      logger.error('Blueprint modification validation failed', {
        blueprintId: data.id,
        userId: socket.player.data.userId,
        violations: validation.violations,
      })
      socket.send('error', {
        message: 'Blueprint validation failed',
        violations: validation.violations,
      })
      return
    }

    const blueprint = this.serverNetwork.blueprints.get(data.id)
    if (data.version > blueprint.version) {
      this.serverNetwork.blueprints.modify(data)
      this.serverNetwork.send('blueprintModified', data, socket.id)
      this.serverNetwork.dirtyBlueprints.add(data.id)
    }
    else {
      socket.send('blueprintModified', blueprint)
    }
  }

  onEntityAdded(socket, data) {
    if (!socket.player.isBuilder()) {
      logger.error('player attempted to add entity without builder permission')
      return
    }

    const validation = ScriptValidator.validateEntityData(data, {
      userId: socket.player.data.userId,
      entityId: data.id,
    })

    if (!validation.valid) {
      logger.error('Entity data validation failed', {
        entityId: data.id,
        userId: socket.player.data.userId,
        violations: validation.violations,
      })
      socket.send('error', {
        message: 'Entity data validation failed',
        violations: validation.violations,
      })
      return
    }

    const entity = this.serverNetwork.entities.add(data)
    this.serverNetwork.send('entityAdded', data, socket.id)
    if (entity.isApp) this.serverNetwork.dirtyApps.add(entity.data.id)
  }

  async onEntityModified(socket, data) {
    if (!socket.player.isBuilder()) {
      logger.error('player attempted to modify entity without builder permission')
      return
    }

    const entity = this.serverNetwork.entities.get(data.id)
    if (!entity) {
      logger.error('onEntityModified: no entity found', { id: data.id })
      return
    }

    if (entity.isApp && !socket.player.isAdmin()) {
      const ownerUserId = entity.data.userId
      if (ownerUserId && ownerUserId !== socket.player.data.userId) {
        logger.error('player attempted to modify app entity they do not own')
        return
      }
    }

    const validation = ScriptValidator.validateEntityData(data, {
      userId: socket.player.data.userId,
      entityId: data.id,
    })

    if (!validation.valid) {
      logger.error('Entity modification validation failed', {
        entityId: data.id,
        userId: socket.player.data.userId,
        violations: validation.violations,
      })
      socket.send('error', {
        message: 'Entity data validation failed',
        violations: validation.violations,
      })
      return
    }

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
    if (!socket.player.isBuilder()) {
      logger.error('player attempted to modify settings without builder permission')
      return
    }
    this.serverNetwork.settings.set(data.key, data.value)
    this.serverNetwork.send('settingsModified', data, socket.id)
  }

  async onSpawnModified(socket, op) {
    if (!socket.player.isBuilder()) {
      logger.error('player attempted to modify spawn without builder permission')
      return
    }
    const player = socket.player
    if (op === 'set') {
      this.serverNetwork.spawn = { position: player.data.position.slice(), quaternion: player.data.quaternion.slice() }
    } else if (op === 'clear') {
      this.serverNetwork.spawn = { position: [0, 0, 0], quaternion: [0, 0, 0, 1] }
    } else {
      return
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
    const [id, version, name, data] = event
    const entity = this.serverNetwork.entities.get(id)
    entity?.onEvent(version, name, data, socket.id)
  }
}
