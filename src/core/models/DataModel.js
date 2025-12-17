
export class DataModel {
  static #definitions = new Map()
  static #validators = new Map()

  static define(name, schema, validator = null) {
    this.#definitions.set(name, schema)
    if (validator) {
      this.#validators.set(name, validator)
    }
    return this
  }

  static defineBatch(models) {
    for (const [name, { schema, validator }] of Object.entries(models)) {
      this.define(name, schema, validator)
    }
    return this
  }

  static create(modelName, data = {}) {
    const schema = this.#definitions.get(modelName)
    if (!schema) {
      throw new Error(`Unknown model: ${modelName}`)
    }

    const instance = { ...schema }
    for (const [key, value] of Object.entries(data)) {
      if (key in instance) {
        instance[key] = value
      }
    }

    const validator = this.#validators.get(modelName)
    if (validator) {
      const error = validator(instance)
      if (error) throw new Error(`Validation failed: ${error}`)
    }

    return instance
  }

  static createBatch(modelName, dataArray) {
    return dataArray.map(data => this.create(modelName, data))
  }

  static get(modelName) {
    return this.#definitions.get(modelName)
  }

  static extend(modelName, parentName, additions = {}) {
    const parent = this.#definitions.get(parentName)
    if (!parent) {
      throw new Error(`Parent model not found: ${parentName}`)
    }
    const schema = { ...parent, ...additions }
    this.define(modelName, schema)
    return this
  }

  static validate(modelName, instance) {
    const validator = this.#validators.get(modelName)
    return validator ? validator(instance) : null
  }

  static list() {
    return Array.from(this.#definitions.keys())
  }

  static clear() {
    this.#definitions.clear()
    this.#validators.clear()
    return this
  }
}

DataModel.define('Player', {
  id: null,
  name: 'Player',
  avatar: null,
  rank: 0,
  position: [0, 0, 0],
  quaternion: [0, 0, 0, 1]
})

DataModel.define('Entity', {
  id: null,
  name: 'Entity',
  blueprint: null,
  position: [0, 0, 0],
  quaternion: [0, 0, 0, 1],
  scale: [1, 1, 1],
  data: {}
})

DataModel.define('Blueprint', {
  id: null,
  name: 'Blueprint',
  model: null,
  script: null,
  props: {},
  actions: []
})

DataModel.define('WorldConfig', {
  title: null,
  description: null,
  image: null,
  avatar: null,
  maxPlayers: 0,
  voice: 'spatial',
  rank: 0
})
