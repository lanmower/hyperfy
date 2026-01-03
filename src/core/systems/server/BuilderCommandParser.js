import { ScriptValidator } from '../../../server/security/ScriptValidator.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('BuilderCommandParser')

export class BuilderCommandParser {
  constructor(serverNetwork) {
    this.serverNetwork = serverNetwork
  }

  parseBlueprint(socket, blueprint) {
    if (!socket.player.isBuilder()) {
      logger.error('player attempted to add blueprint without builder permission')
      return { valid: false, error: 'permission' }
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
      return { valid: false, error: 'validation', violations: validation.violations }
    }
    return { valid: true, data: blueprint }
  }

  parseEntity(socket, data) {
    if (!socket.player.isBuilder()) {
      logger.error('player attempted to add entity without builder permission')
      return { valid: false, error: 'permission' }
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
      return { valid: false, error: 'validation', violations: validation.violations }
    }
    return { valid: true, data }
  }

  parseEntityModification(socket, data) {
    if (!socket.player.isBuilder()) {
      logger.error('player attempted to modify entity without builder permission')
      return { valid: false, error: 'permission' }
    }
    const entity = this.serverNetwork.entities.get(data.id)
    if (!entity) {
      logger.error('onEntityModified: no entity found', { id: data.id })
      return { valid: false, error: 'not_found' }
    }
    if (entity.isApp && !socket.player.isAdmin()) {
      const ownerUserId = entity.data.userId
      if (ownerUserId && ownerUserId !== socket.player.data.userId) {
        logger.error('player attempted to modify app entity they do not own')
        return { valid: false, error: 'ownership' }
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
      return { valid: false, error: 'validation', violations: validation.violations }
    }
    return { valid: true, data, entity }
  }

  parseSettings(socket, data) {
    if (!socket.player.isBuilder()) {
      logger.error('player attempted to modify settings without builder permission')
      return { valid: false, error: 'permission' }
    }
    return { valid: true, data }
  }

  parseSpawn(socket, op) {
    if (!socket.player.isBuilder()) {
      logger.error('player attempted to modify spawn without builder permission')
      return { valid: false, error: 'permission' }
    }
    if (op !== 'set' && op !== 'clear') {
      return { valid: false, error: 'invalid_op' }
    }
    return { valid: true, op, socket }
  }

  parseEvent(socket, event) {
    const [id, version, name, data] = event
    const entity = this.serverNetwork.entities.get(id)
    if (!entity) {
      logger.error('Entity not found for event', { id })
      return { valid: false, error: 'not_found' }
    }
    return { valid: true, entity, version, name, data, socketId: socket.id }
  }
}
