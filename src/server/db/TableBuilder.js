export class TableBuilder {
  constructor(name) {
    this.name = name
    this.columns = []
  }

  string(name) {
    this.columns.push(`${name} TEXT`)
    return {
      primary: () => {
        this.columns[this.columns.length - 1] += ' PRIMARY KEY'
        return this
      },
      notNullable: () => {
        this.columns[this.columns.length - 1] += ' NOT NULL'
        return this
      },
      nullable: () => this,
    }
  }

  text(name) {
    this.columns.push(`${name} TEXT`)
    return {
      notNullable: () => {
        this.columns[this.columns.length - 1] += ' NOT NULL'
        return this
      },
    }
  }

  timestamp(name) {
    this.columns.push(`${name} TEXT`)
    return {
      notNullable: () => {
        this.columns[this.columns.length - 1] += ' NOT NULL'
        return this
      },
    }
  }

  integer(name) {
    this.columns.push(`${name} INTEGER`)
    return {
      notNullable: () => {
        this.columns[this.columns.length - 1] += ' NOT NULL'
        return this
      },
      defaultTo: (val) => {
        this.columns[this.columns.length - 1] += ` DEFAULT ${val}`
        return this
      },
    }
  }

  renameColumn() {
    return this
  }

  dropColumn() {
    return this
  }

  build() {
    return `CREATE TABLE IF NOT EXISTS ${this.name} (${this.columns.join(', ')})`
  }
}

export class AlterTableBuilder {
  constructor(name, db) {
    this.name = name
    this.db = db
  }

  string(name) {
    return {
      nullable: () => {
        try {
          this.db.run(`ALTER TABLE ${this.name} ADD COLUMN ${name} TEXT`)
        } catch (e) {
        }
        return this
      },
    }
  }

  integer(name) {
    return {
      notNullable: () => {
        return {
          defaultTo: () => {
            try {
              this.db.run(`ALTER TABLE ${this.name} ADD COLUMN ${name} INTEGER DEFAULT 0`)
            } catch (e) {
              console.error(`Failed to add column ${name} to table ${this.name}:`, e)
              throw e
            }
            return this
          },
        }
      },
    }
  }

  renameColumn(oldName, newName) {
    return this
  }

  dropColumn(name) {
    return this
  }
}
