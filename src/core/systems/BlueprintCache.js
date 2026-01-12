export class BlueprintCache {
  constructor(logger) {
    this.logger = logger || { info: () => {}, warn: () => {}, error: () => {} }
    this.items = new Map()
    this.modelCache = new Map()
    this.scriptCache = new Map()
  }

  addToCache(id, blueprint) {
    this.items.set(id, blueprint)
    return blueprint
  }

  getFromCache(id) {
    return this.items.get(id)
  }

  addModelToCache(url, model) {
    this.modelCache.set(url, model)
    return model
  }

  getModelFromCache(url) {
    return this.modelCache.get(url)
  }

  addScriptToCache(url, script) {
    this.scriptCache.set(url, script)
    return script
  }

  getScriptFromCache(url) {
    return this.scriptCache.get(url)
  }

  clearCache(id) {
    if (id) {
      this.items.delete(id)
    } else {
      this.items.clear()
    }
  }

  clearModelCache(url) {
    if (url) {
      this.modelCache.delete(url)
    } else {
      this.modelCache.clear()
    }
  }

  clearScriptCache(url) {
    if (url) {
      this.scriptCache.delete(url)
    } else {
      this.scriptCache.clear()
    }
  }

  clearAllCaches() {
    this.items.clear()
    this.modelCache.clear()
    this.scriptCache.clear()
  }

  getCacheStats() {
    return {
      blueprints: this.items.size,
      models: this.modelCache.size,
      scripts: this.scriptCache.size,
      total: this.items.size + this.modelCache.size + this.scriptCache.size,
    }
  }

  getAllBlueprints() {
    const blueprints = []
    this.items.forEach(bp => blueprints.push(bp))
    return blueprints
  }

  serialize() {
    return this.getAllBlueprints()
  }
}
