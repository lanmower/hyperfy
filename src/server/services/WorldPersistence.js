// Unified database persistence for world data

export class WorldPersistence {
  constructor(db) {
    this.db = db
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
    const exists = await this.loadUser(userId)
    if (exists) {
      await this.db('users').where('id', userId).update(data)
    } else {
      await this.db('users').insert({ id: userId, ...data })
    }
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
    const exists = await this.db('config').where('key', key).first()
    if (exists) {
      await this.db('config').where('key', key).update({ value })
    } else {
      await this.db('config').insert({ key, value })
    }
  }
}
