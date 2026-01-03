class QueryBuilder {
  constructor(db, table) {
    this.db = db
    this.table = table
    this.conditions = []
  }

  where(key, value) {
    if (typeof key === 'object' && value === undefined) {
      // Handle where({ id: value }) syntax
      for (const [k, v] of Object.entries(key)) {
        this.conditions.push({ key: k, value: v })
      }
    } else {
      // Handle where('id', value) syntax
      this.conditions.push({ key, value })
    }
    return this
  }

  async first() {
    const rows = await this.execute()
    return rows[0] || null
  }

  async execute() {
    let sql = 'SELECT * FROM ' + this.table
    const params = []

    for (let i = 0; i < this.conditions.length; i++) {
      const cond = this.conditions[i]
      sql += (i === 0 ? ' WHERE ' : ' AND ') + cond.key + ' = ?'
      params.push(cond.value)
    }

    return await this.db.query(sql, params)
  }

  async insert(data) {
    const keys = Object.keys(data)
    const values = Object.values(data)
    const placeholders = keys.map(() => '?').join(',')
    const sql = 'INSERT INTO ' + this.table + ' (' + keys.join(',') + ') VALUES (' + placeholders + ')'
    await this.db.exec(sql, values)
    return { changes: 1 }
  }

  async update(data) {
    if (!this.conditions.length) throw new Error('Update without WHERE')
    const keys = Object.keys(data)
    const values = Object.values(data)
    let sql = 'UPDATE ' + this.table + ' SET ' + keys.map(k => k + ' = ?').join(', ')
    const params = [...values]
    for (let i = 0; i < this.conditions.length; i++) {
      const cond = this.conditions[i]
      sql += (i === 0 ? ' WHERE ' : ' AND ') + cond.key + ' = ?'
      params.push(cond.value)
    }
    await this.db.exec(sql, params)
    return { changes: 1 }
  }

  async delete() {
    if (!this.conditions.length) throw new Error('Delete without WHERE')
    let sql = 'DELETE FROM ' + this.table
    const params = []
    for (let i = 0; i < this.conditions.length; i++) {
      const cond = this.conditions[i]
      sql += (i === 0 ? ' WHERE ' : ' AND ') + cond.key + ' = ?'
      params.push(cond.value)
    }
    await this.db.exec(sql, params)
    return { changes: 1 }
  }

  async count(field) {
    field = field || 'id'
    let sql = 'SELECT COUNT(' + field + ') as count FROM ' + this.table
    const params = []
    for (let i = 0; i < this.conditions.length; i++) {
      const cond = this.conditions[i]
      sql += (i === 0 ? ' WHERE ' : ' AND ') + cond.key + ' = ?'
      params.push(cond.value)
    }
    const result = await this.db.query(sql, params)
    return result[0]?.count || 0
  }

  cacheAs(key) {
    return this
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject)
  }

  catch(reject) {
    return this.execute().catch(reject)
  }

  finally(fn) {
    return this.execute().finally(fn)
  }
}

export function createDbProxy(rawDb) {
  return (table) => new QueryBuilder(rawDb, table)
}
