import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('CacheWarmer')

export class CacheWarmer {
  constructor(db) {
    this.db = db
    this.warmed = false
  }

  async warm() {
    if (this.warmed) return

    logger.info('Starting cache warmup', {})
    const start = Date.now()

    try {
      await this.warmBlueprints()
      await this.warmUsers()
      await this.warmEntities()
      await this.warmConfig()
    } catch (e) {
      logger.warn('Cache warmup incomplete', { error: e.message })
    }

    const duration = Date.now() - start
    logger.info('Cache warmup complete', { duration })
    this.warmed = true
  }

  async warmBlueprints() {
    try {
      const blueprints = await this.db('blueprints').noCache()
      if (blueprints && blueprints.length > 0) {
        for (const bp of blueprints.slice(0, 100)) {
          this.db.cache.set('getBlueprintsForUser', { id: bp.id }, bp, 300000)
        }
      }
    } catch (e) {
      logger.warn('Blueprint warmup failed', { error: e.message })
    }
  }

  async warmUsers() {
    try {
      const users = await this.db('users').noCache()
      if (users && users.length > 0) {
        for (const user of users.slice(0, 50)) {
          this.db.cache.set('getUserById', { id: user.id }, user, 600000)
        }
      }
    } catch (e) {
      logger.warn('User warmup failed', { error: e.message })
    }
  }

  async warmEntities() {
    try {
      const entities = await this.db('entities').noCache()
      if (entities && entities.length > 0) {
        const sample = entities.slice(0, 200)
        this.db.cache.set('getEntitiesInWorld', {}, sample, 60000)
      }
    } catch (e) {
      logger.warn('Entity warmup failed', { error: e.message })
    }
  }

  async warmConfig() {
    try {
      const config = await this.db.query(`SELECT * FROM config LIMIT 20`)
      if (config && config.length > 0) {
        for (const cfg of config) {
          this.db.cache.set('getConfigValue', { key: cfg.key }, cfg, 300000)
        }
      }
    } catch (e) {
      logger.warn('Config warmup failed', { error: e.message })
    }
  }

  getStats() {
    return {
      warmed: this.warmed,
      cacheStats: this.db.cache.getStats(),
    }
  }
}

export default CacheWarmer
