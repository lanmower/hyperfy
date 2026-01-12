import { LoggerFactory } from '../../core/utils/logging/index.js'

const logger = LoggerFactory.get('WorldPersistenceSerializer')

export class WorldPersistenceSerializer {
  static exportBlueprints(blueprints) {
    const exported = []
    for (const blueprint of blueprints) {
      try {
        const data = typeof blueprint === 'string' ? JSON.parse(blueprint) : blueprint
        exported.push(data)
      } catch (err) {
        logger.error('Failed to parse blueprint during export', { error: err.message })
      }
    }
    return exported
  }

  static exportEntities(entities) {
    const exported = []
    for (const entity of entities) {
      try {
        const data = typeof entity === 'string' ? JSON.parse(entity) : entity
        exported.push(data)
      } catch (err) {
        logger.error('Failed to parse entity during export', { error: err.message })
      }
    }
    return exported
  }

  static parseSpawn(spawn) {
    try {
      return JSON.parse(spawn)
    } catch (err) {
      logger.error('Failed to parse spawn', { error: err.message })
      return { position: [0, 0, 0], quaternion: [0, 0, 0, 1] }
    }
  }

  static parseSettings(settings) {
    try {
      return JSON.parse(settings)
    } catch (err) {
      logger.error('Failed to parse settings', { error: err.message })
      return {}
    }
  }

  static parseBlueprints(blueprints) {
    return blueprints.map(b => {
      try {
        return JSON.parse(b.data)
      } catch (err) {
        logger.error('Failed to parse blueprint', { blueprintId: b.id, error: err.message })
        return {}
      }
    })
  }

  static parseEntities(entities) {
    return entities.map(e => {
      try {
        return JSON.parse(e.data)
      } catch (err) {
        logger.error('Failed to parse entity', { entityId: e.id, error: err.message })
        return {}
      }
    })
  }

  static createBackupPackage(blueprints, entities, settings, spawn) {
    return {
      blueprints: this.parseBlueprints(blueprints),
      entities: this.parseEntities(entities),
      settings: this.parseSettings(settings),
      spawn: this.parseSpawn(spawn),
      timestamp: Date.now(),
    }
  }
}
