// Unified database persistence for world data

export class WorldPersistence {
  constructor(db, fileUploader = null) {
    this.db = db
    this.fileUploader = fileUploader
  }

  async upsert(table, whereClause, data) {
    const exists = await this.db(table).where(whereClause).first()
    if (exists) {
      await this.db(table).where(whereClause).update(data)
    } else {
      const insertData = Object.assign({}, Object.fromEntries(
        Object.entries(whereClause).map(([k, v]) => [k, v])
      ), data)
      await this.db(table).insert(insertData)
    }
  }

  async loadSpawn() {
    const row = await this.db('config').where('key', 'spawn').first()
    return row?.value || '{ "position": [0, 0, 0], "quaternion": [0, 0, 0, 1] }'
  }

  async saveSpawn(value) {
    await this.db('config').where('key', 'spawn').update({ value })
  }

  async loadSettings() {
    const row = await this.db('config').where('key', 'settings').first()
    return row ? JSON.parse(row.value) : {}
  }

  async saveSettings(settings) {
    await this.db('config').where('key', 'settings').update({ value: JSON.stringify(settings) })
  }

  async loadBlueprints() {
    return await this.db('blueprints')
  }

  async saveRecord(table, id, data, createdAt, updatedAt) {
    const exists = await this.db(table).where('id', id).first()
    const now = updatedAt || new Date().toISOString()
    const created = createdAt || now
    if (exists) {
      await this.db(table).where('id', id).update({
        data: JSON.stringify(data),
        updatedAt: now
      })
    } else {
      await this.db(table).insert({
        id,
        data: JSON.stringify(data),
        createdAt: created,
        updatedAt: now
      })
    }
  }

  async saveBlueprint(id, data, createdAt, updatedAt) {
    return this.saveRecord('blueprints', id, data, createdAt, updatedAt)
  }

  async loadEntities() {
    return await this.db('entities')
  }

  async saveEntity(id, data, createdAt, updatedAt) {
    return this.saveRecord('entities', id, data, createdAt, updatedAt)
  }

  async deleteEntity(id) {
    await this.db('entities').where('id', id).delete()
  }

  async loadUser(userId) {
    return await this.db('users').where('id', userId).first()
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
    const row = await this.db('config').where('key', key).first()
    return row?.value
  }

  async setConfig(key, value) {
    await this.upsert('config', { key }, { value })
  }

  async exportBlueprints(blueprints) {
    const exported = []
    for (const blueprint of blueprints) {
      const data = typeof blueprint === 'string' ? JSON.parse(blueprint) : blueprint
      exported.push(data)
    }
    return exported
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
    const exported = []
    for (const entity of entities) {
      const data = typeof entity === 'string' ? JSON.parse(entity) : entity
      exported.push(data)
    }
    return exported
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

    return {
      blueprints: blueprints.map(b => JSON.parse(b.data)),
      entities: entities.map(e => JSON.parse(e.data)),
      settings,
      spawn: JSON.parse(spawn),
      timestamp: Date.now()
    }
  }

  async restoreWorld(backup, uploader = null) {
    const results = {
      blueprints: [],
      entities: [],
      settings: false,
      spawn: false
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

