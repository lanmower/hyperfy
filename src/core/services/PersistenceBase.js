
export class PersistenceBase {
  constructor(db) {
    this.db = db
  }

  async upsert(table, whereClause, data) {
    const exists = await this.db(table).where(whereClause).first()
    if (exists) {
      await this.db(table).where(whereClause).update(data)
    } else {
      const insertData = { ...whereClause, ...data }
      await this.db(table).insert(insertData)
    }
  }

  async save(table, id, data, createdAt, updatedAt) {
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

  async load(table, id) {
    const row = await this.db(table).where('id', id).first()
    return row ? JSON.parse(row.data) : null
  }

  async loadAll(table, options = {}) {
    const query = this.db(table)
    if (options.where) {
      for (const [key, value] of Object.entries(options.where)) {
        query.where(key, value)
      }
    }
    if (options.limit) query.limit(options.limit)
    if (options.offset) query.offset(options.offset)
    return await query
  }

  async delete(table, id) {
    await this.db(table).where('id', id).delete()
  }

  async deleteWhere(table, clause) {
    await this.db(table).where(clause).delete()
  }

  async count(table, clause = null) {
    let query = this.db(table)
    if (clause) {
      query = query.where(clause)
    }
    const result = await query.count('id as count').first()
    return result.count
  }

  async exists(table, id) {
    const row = await this.db(table).where('id', id).first()
    return !!row
  }
}
