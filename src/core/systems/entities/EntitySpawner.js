import { App } from '../../entities/App.js'
import { PlayerLocal } from '../../entities/PlayerLocal.js'
import { PlayerRemote } from '../../entities/PlayerRemote.js'
import { EVENT } from '../../constants/EventNames.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('EntitySpawner')
let hyperfyEntityValidation = null

const Types = {
  app: App,
  playerLocal: PlayerLocal,
  playerRemote: PlayerRemote,
}

function isValidNumber(val) {
  return typeof val === 'number' && !isNaN(val) && isFinite(val)
}

function validateVector3(vec, name) {
  if (!vec) {
    return { valid: true }
  }

  if (Array.isArray(vec)) {
    if (vec.length !== 3 || !vec.every(isValidNumber)) {
      return { valid: false, error: `${name} array contains invalid numbers` }
    }
    return { valid: true }
  }

  if (typeof vec !== 'object') {
    return { valid: false, error: `${name} is not object or array` }
  }

  if (!isValidNumber(vec.x) || !isValidNumber(vec.y) || !isValidNumber(vec.z)) {
    return { valid: false, error: `${name} contains invalid numbers` }
  }

  return { valid: true }
}

function validateQuaternion(quat, name) {
  if (!quat) {
    return { valid: true }
  }

  if (Array.isArray(quat)) {
    if (quat.length !== 4 || !quat.every(isValidNumber)) {
      return { valid: false, error: `${name} array contains invalid numbers` }
    }
    return { valid: true }
  }

  if (typeof quat !== 'object') {
    return { valid: false, error: `${name} is not object or array` }
  }

  if (!isValidNumber(quat.x) || !isValidNumber(quat.y) || !isValidNumber(quat.z) || !isValidNumber(quat.w)) {
    return { valid: false, error: `${name} contains invalid numbers` }
  }

  return { valid: true }
}

export class EntitySpawner {
  constructor(world, entities) {
    this.world = world
    this.entities = entities
    this.invalidEntityCount = 0
    this.invalidEntityWindow = Date.now()
  }

  validateEntityData(data) {
    if (!data || typeof data !== 'object') {
      logger.error('Entity data is not object', { type: typeof data })
      return { valid: false, error: 'Invalid entity data type' }
    }

    if (!data.id || typeof data.id !== 'string') {
      logger.error('Entity id is invalid', { id: data.id })
      return { valid: false, error: 'Invalid entity id' }
    }

    if (!data.type || typeof data.type !== 'string') {
      logger.error('Entity type is invalid', { type: data.type })
      return { valid: false, error: 'Invalid entity type' }
    }

     const validTypes = ['app', 'player', 'playerLocal', 'playerRemote']
     if (!validTypes.includes(data.type)) {
       logger.error('Unknown entity type', { type: data.type, validTypes })
       return { valid: false, error: 'Unknown entity type' }
     }

    if (data.position) {
      const posValidation = validateVector3(data.position, 'position')
      if (!posValidation.valid) {
        logger.error('Entity position invalid', { error: posValidation.error })
        return posValidation
      }
    }

    if (data.quaternion) {
      const quatValidation = validateQuaternion(data.quaternion, 'quaternion')
      if (!quatValidation.valid) {
        logger.error('Entity quaternion invalid', { error: quatValidation.error })
        return quatValidation
      }
    }

    if (data.scale) {
      const scaleValidation = validateVector3(data.scale, 'scale')
      if (!scaleValidation.valid) {
        logger.error('Entity scale invalid', { error: scaleValidation.error })
        return scaleValidation
      }
    }

    return { valid: true }
  }

  trackInvalidEntity() {
    const now = Date.now()
    if (now - this.invalidEntityWindow > 60000) {
      this.invalidEntityCount = 0
      this.invalidEntityWindow = now
    }

    this.invalidEntityCount++
    if (this.invalidEntityCount > 10) {
      logger.error('Invalid entity threshold exceeded', { count: this.invalidEntityCount })
      return true
    }

    return false
  }

  spawn(data, local) {
    logger.info('spawn() called', { type: data.type, id: data.id, userId: data.userId })

    const validation = this.validateEntityData(data)
    if (!validation.valid) {
      logger.error('Entity data validation failed', { error: validation.error, id: data?.id, type: data?.type })

      if (this.trackInvalidEntity()) {
        logger.error('Too many invalid entities, potential attack')
      }

      return null
    }

    if (hyperfyEntityValidation && data.type === 'app' && data.blueprint) {
      const hyperfyValidation = hyperfyEntityValidation.validateEntityCreation(this.world, data)
      if (!hyperfyValidation.valid) {
        logger.error('Entity creation rejected', { error: hyperfyValidation.error })
        if (local && this.entities.network && this.entities.network.send) {
          this.entities.network.send('entityCreationFailed', hyperfyValidation.error)
        }
        return null
      }
    }

    let Entity
    const isLocalPlayer = data.userId === this.entities.network.id
    if (data.type === 'player') {
      Entity = Types[isLocalPlayer ? 'playerLocal' : 'playerRemote']
      logger.info('Creating player entity', { isLocal: isLocalPlayer })
    } else {
      Entity = Types[data.type]
    }
    logger.info('Entity class resolved', { entityClass: Entity?.name || 'unknown' })
    const entity = new Entity(this.world, data, local)

    // Register entity atomically before emitting events
    this.entities.items.set(entity.data.id, entity)
    if (data.type === 'player') {
      this.entities.players.set(entity.data.id, entity)
      if (isLocalPlayer) {
        this.entities.player = entity
      }
    }

    // Emit events after entity is fully registered
    if (data.type === 'player') {
      if (this.entities.network.isClient && !isLocalPlayer) {
        if (this.entities.events) {
          this.entities.events.emit(EVENT.game.enter, { playerId: entity.data.id })
        }
      }
      if (isLocalPlayer && this.entities.events) {
        this.entities.events.emit(EVENT.player, entity)
      }
    }

    if (this.entities.events) {
      this.entities.events.emit(EVENT.entity.added, entity)
    }
    return entity
  }
}
