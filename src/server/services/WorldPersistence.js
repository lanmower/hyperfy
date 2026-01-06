import { PersistenceBase } from '../../core/services/PersistenceBase.js'
import { ScriptValidator } from '../security/ScriptValidator.js'
import { LoggerFactory } from '../../core/utils/logging/index.js'
import { WorldPersistenceSerializer } from './WorldPersistenceSerializer.js'

const logger = LoggerFactory.get('WorldPersistence')

export class WorldPersistence extends PersistenceBase {
  constructor(db, fileUploader = null) {
    super(db)
    this.fileUploader = fileUploader
  }

  async loadSpawn() {
    const row = await this.db('config').where('key', 'spawn').cacheAs('getConfigValue').first()
    return row?.value || '{ "position": [0, 10, 0], "quaternion": [0, 0, 0, 1] }'
  }

  async saveSpawn(value) {
    await this.db('config').where('key', 'spawn').update({ value })
  }

  async loadSettings() {
    const row = await this.db('config').where('key', 'settings').cacheAs('getConfigValue').first()
    if (!row) return {}
    return WorldPersistenceSerializer.parseSettings(row.value)
  }

  async saveSettings(settings) {
    await this.db('config').where('key', 'settings').update({ value: JSON.stringify(settings) })
  }

  async loadBlueprints() {
    return await this.db('blueprints').cacheAs('getBlueprints')
  }

  async saveBlueprint(id, data, createdAt, updatedAt) {
    const validation = ScriptValidator.validateBlueprint(data, { blueprintId: id })

    if (!validation.valid) {
      logger.warn('Blueprint validation failed before saving', {
        blueprintId: id,
        violations: validation.violations,
      })
    }

    return this.save('blueprints', id, data, createdAt, updatedAt)
  }

  async loadEntities() {
    return await this.db('entities').cacheAs('getEntities')
  }

  async saveEntity(id, data, createdAt, updatedAt) {
    const validation = ScriptValidator.validateEntityData(data, { entityId: id })

    if (!validation.valid) {
      logger.warn('Entity data validation failed before saving', {
        entityId: id,
        violations: validation.violations,
      })
    }

    return this.save('entities', id, data, createdAt, updatedAt)
  }

  async deleteEntity(id) {
    await this.delete('entities', id)
  }

  async loadUser(userId) {
    return await this.db('users').where('id', userId).cacheAs('getUserById').first()
  }

  async saveUser(userId, data) {
    await this.upsert('users', { id: userId }, data)
  }

  async updateUserRank(userId, rank) {
    await this.db('users').where('id', userId).update({ rank })
  }

  async updateUserData(userId, changes) {
    await this.db('users').where('id', userId).update(changes)
  }

  async getConfig(key) {
    const row = await this.db('config').where('key', key).cacheAs('getConfigValue').first()
    return row?.value
  }

  async setConfig(key, value) {
    await this.upsert('config', { key }, { value })
  }

  async exportBlueprints(blueprints) {
    return WorldPersistenceSerializer.exportBlueprints(blueprints)
  }

  async importBlueprints(blueprints, uploader = null) {
    const results = []
    for (const blueprint of blueprints) {
      try {
        await this.saveBlueprint(blueprint.id, blueprint)
        results.push({ success: true, id: blueprint.id })
      } catch (error) {
        results.push({ success: false, id: blueprint.id, error: error.message })
      }
    }
    return results
  }

  async exportEntities(entities) {
    return WorldPersistenceSerializer.exportEntities(entities)
  }

  async importEntities(entities, uploader = null) {
    const results = []
    for (const entity of entities) {
      try {
        await this.saveEntity(entity.id, entity)
        results.push({ success: true, id: entity.id })
      } catch (error) {
        results.push({ success: false, id: entity.id, error: error.message })
      }
    }
    return results
  }

  async backupWorld() {
    const blueprints = await this.loadBlueprints()
    const entities = await this.loadEntities()
    const settings = await this.loadSettings()
    const spawn = await this.loadSpawn()

    return WorldPersistenceSerializer.createBackupPackage(blueprints, entities, settings, spawn)
  }

  async restoreWorld(backup, uploader = null) {
    const results = {
      blueprints: [],
      entities: [],
      settings: false,
      spawn: false,
    }

    if (backup.blueprints) {
      results.blueprints = await this.importBlueprints(backup.blueprints, uploader)
    }

    if (backup.entities) {
      results.entities = await this.importEntities(backup.entities, uploader)
    }

    if (backup.settings) {
      try {
        await this.saveSettings(backup.settings)
        results.settings = true
      } catch (error) {
        results.settings = error.message
      }
    }

    if (backup.spawn) {
      try {
        await this.setConfig('spawn', JSON.stringify(backup.spawn))
        results.spawn = true
      } catch (error) {
        results.spawn = error.message
      }
    }

    return results
  }

  async getFileStats() {
    if (!this.fileUploader) return null
    return this.fileUploader.getStats()
  }

  async listFiles(options = {}) {
    if (!this.fileUploader) return []
    return await this.fileUploader.storage.listAll(options)
  }
}
