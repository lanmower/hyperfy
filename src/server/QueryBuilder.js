export class QueryBuilder {
  constructor(db, table) {
    this.db = db
    this.table = table
    this.conditions = []
    this.selectFields = ["*"]
    this.limitNum = null
    this.offsetNum = null
  }

  where(key, value) {
    this.conditions.push({ key, value })
    return this
  }

  select(...fields) {
    this.selectFields = fields.length ? fields : ["*"]
    return this
  }

  limit(n) {
    this.limitNum = n
    return this
  }

  offset(n) {
    this.offsetNum = n
    return this
  }

  async first() {
    const rows = await this.execute()
    return rows[0] || null
  }

  async execute() {
    let sql = "SELECT " + this.selectFields.join(", ") + " FROM " + this.table
    const params = []

    for (const cond of this.conditions) {
      if (!params.length) {
        sql += " WHERE "
      } else {
        sql += " AND "
      }
      sql += cond.key + " = ?"
      params.push(cond.value)
    }

    if (this.limitNum !== null) {
      sql += " LIMIT " + this.limitNum
    }
    if (this.offsetNum !== null) {
      sql += " OFFSET " + this.offsetNum
    }

    return await this.db.query(sql, params)
  }

  async insert(data) {
    const keys = Object.keys(data)
    const values = Object.values(data)
    const placeholders = keys.map(() => "?").join(",")
    const sql = "INSERT INTO " + this.table + " (" + keys.join(",") + ") VALUES (" + placeholders + ")"
    await this.db.exec(sql, values)
    return { changes: 1 }
  }

  async update(data) {
    if (!this.conditions.length) throw new Error("Update without WHERE clause")
    const keys = Object.keys(data)
    const values = Object.values(data)
    let sql = "UPDATE " + this.table + " SET " + keys.map(k => k + " = ?").join(", ")
    const params = [...values]

    for (const cond of this.conditions) {
      sql += " WHERE " + cond.key + " = ?"
      params.push(cond.value)
    }

    await this.db.exec(sql, params)
    return { changes: 1 }
  }

  async delete() {
    if (!this.conditions.length) throw new Error("Delete without WHERE clause")
    let sql = "DELETE FROM " + this.table
    const params = []

    for (const cond of this.conditions) {
      if (!params.length) {
        sql += " WHERE "
      } else {
        sql += " AND "
      }
      sql += cond.key + " = ?"
      params.push(cond.value)
    }

    await this.db.exec(sql, params)
    return { changes: 1 }
  }

  async count(field) {
    field = field || "id"
    let sql = "SELECT COUNT(" + field + ") as count FROM " + this.table
    const params = []

    for (const cond of this.conditions) {
      if (!params.length) {
        sql += " WHERE "
      } else {
        sql += " AND "
      }
      sql += cond.key + " = ?"
      params.push(cond.value)
    }

    const result = await this.db.query(sql, params)
    return result[0]?.count || 0
  }

  cacheAs(cacheKey) {
    return this
  }
}

export function createQueryProxy(db) {
  return function(table) {
    return new QueryBuilder(db, table)
  }
}
