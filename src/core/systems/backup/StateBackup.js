import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('StateBackup')

export class StateBackup {
  constructor(world) {
    this.world = world
    this.backups = []
    this.maxBackups = 20
    this.version = '1.0.0'
    this.lastBackupTime = null
  }

  createBackup(label = '', includeMetadata = true) {
    try {
      const backup = {
        id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        label: label || `Auto-backup ${new Date().toISOString()}`,
        version: this.version,
        data: {
          blueprints: this.backupBlueprints(),
          entities: this.backupEntities(),
          players: this.backupPlayers(),
          metadata: includeMetadata ? this.createMetadata() : null
        },
        size: 0,
        checksum: null
      }

      backup.size = JSON.stringify(backup.data).length
      backup.checksum = this.calculateChecksum(backup.data)

      this.backups.push(backup)
      if (this.backups.length > this.maxBackups) {
        const oldest = this.backups.shift()
        logger.debug('Backup removed (max reached)', { id: oldest.id })
      }

      this.lastBackupTime = Date.now()
      logger.info('Backup created', { id: backup.id, label, size: backup.size })

      return backup
    } catch (error) {
      logger.error('Backup creation failed', { error: error.message })
      return null
    }
  }

  backupBlueprints() {
    const blueprints = {}
    if (!this.world.blueprints?.items) return blueprints

    for (const [id, blueprint] of this.world.blueprints.items) {
      blueprints[id] = {
        id: blueprint.id,
        name: blueprint.name,
        model: blueprint.model,
        script: blueprint.script ? blueprint.script.substring(0, 1000) : null,
        props: JSON.parse(JSON.stringify(blueprint.props || {})),
        createdAt: blueprint.createdAt,
        updatedAt: blueprint.updatedAt
      }
    }

    return blueprints
  }

  backupEntities() {
    const entities = {}
    if (!this.world.entities?.items) return entities

    for (const [id, entity] of this.world.entities.items) {
      if (entity.isApp || entity.isModel) {
        entities[id] = {
          id: entity.data.id,
          blueprint: entity.data.blueprint,
          position: entity.data.position ? [entity.data.position.x, entity.data.position.y, entity.data.position.z] : null,
          rotation: entity.data.rotation ? [entity.data.rotation.x, entity.data.rotation.y, entity.data.rotation.z, entity.data.rotation.w] : null,
          scale: entity.data.scale ? [entity.data.scale.x, entity.data.scale.y, entity.data.scale.z] : null,
          mover: entity.data.mover,
          mode: entity.mode,
          createdAt: entity.data.createdAt
        }
      }
    }

    return entities
  }

  backupPlayers() {
    const players = {}
    if (!this.world.entities?.items) return players

    for (const [id, entity] of this.world.entities.items) {
      if (entity.isPlayer) {
        players[id] = {
          id: entity.data.id,
          position: entity.data.position ? [entity.data.position.x, entity.data.position.y, entity.data.position.z] : null,
          rotation: entity.data.rotation ? [entity.data.rotation.x, entity.data.rotation.y, entity.data.rotation.z, entity.data.rotation.w] : null,
          avatar: entity.data.avatar || null,
          inputMode: entity.data.inputMode || 'normal',
          firstPerson: entity.data.firstPerson || false,
          createdAt: entity.data.createdAt
        }
      }
    }

    return players
  }

  createMetadata() {
    return {
      entityCount: this.world.entities?.items?.size || 0,
      blueprintCount: this.world.blueprints?.items?.size || 0,
      playerCount: Array.from(this.world.entities?.items?.values() || []).filter(e => e.isPlayer).length,
      appCount: Array.from(this.world.entities?.items?.values() || []).filter(e => e.isApp).length,
      modelCount: Array.from(this.world.entities?.items?.values() || []).filter(e => e.isModel).length,
      worldFrame: this.world.frame,
      worldTime: this.world.time,
      networkConnected: this.world.network?.connected || false
    }
  }

  getBackup(id) {
    return this.backups.find(b => b.id === id) || null
  }

  getLatestBackup() {
    return this.backups.length > 0 ? this.backups[this.backups.length - 1] : null
  }

  getAllBackups() {
    return [...this.backups]
  }

  getBackupsByLabel(label) {
    return this.backups.filter(b => b.label.includes(label))
  }

  deleteBackup(id) {
    const index = this.backups.findIndex(b => b.id === id)
    if (index > -1) {
      const removed = this.backups.splice(index, 1)[0]
      logger.info('Backup deleted', { id })
      return removed
    }
    return null
  }

  deleteOldBackups(olderThanMs = 3600000) {
    const cutoffTime = Date.now() - olderThanMs
    const before = this.backups.length
    this.backups = this.backups.filter(b => b.timestamp > cutoffTime)
    const deleted = before - this.backups.length
    if (deleted > 0) logger.info('Old backups deleted', { count: deleted })
    return deleted
  }

  validateBackup(backupId) {
    const backup = this.getBackup(backupId)
    if (!backup) return { valid: false, error: 'Backup not found' }

    const currentChecksum = this.calculateChecksum(backup.data)
    if (currentChecksum !== backup.checksum) {
      return { valid: false, error: 'Checksum mismatch - data corrupted' }
    }

    if (!backup.data.blueprints || !backup.data.entities) {
      return { valid: false, error: 'Missing critical data sections' }
    }

    return { valid: true, backup }
  }

  calculateChecksum(data) {
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16)
  }

  getBackupStats() {
    const now = Date.now()
    const stats = {
      totalBackups: this.backups.length,
      maxBackups: this.maxBackups,
      totalSize: this.backups.reduce((sum, b) => sum + b.size, 0),
      averageSize: this.backups.length > 0 ? this.backups.reduce((sum, b) => sum + b.size, 0) / this.backups.length : 0,
      oldestBackup: this.backups.length > 0 ? this.backups[0].timestamp : null,
      newestBackup: this.backups.length > 0 ? this.backups[this.backups.length - 1].timestamp : null,
      lastBackupTime: this.lastBackupTime,
      timeSinceLastBackup: this.lastBackupTime ? now - this.lastBackupTime : null
    }

    return stats
  }

  clear() {
    const count = this.backups.length
    this.backups = []
    logger.info('All backups cleared', { count })
    return count
  }

  export() {
    return {
      version: this.version,
      exportTime: Date.now(),
      backups: this.backups.map(b => ({
        ...b,
        data: {
          blueprints: b.data.blueprints,
          entities: b.data.entities,
          players: b.data.players,
          metadata: b.data.metadata
        }
      }))
    }
  }

  import(data) {
    try {
      if (data.version !== this.version) {
        logger.warn('Version mismatch on import', { expected: this.version, got: data.version })
      }

      if (!Array.isArray(data.backups)) {
        return { success: false, error: 'Invalid backup format' }
      }

      this.backups = data.backups
      logger.info('Backups imported', { count: this.backups.length })
      return { success: true, count: this.backups.length }
    } catch (error) {
      logger.error('Backup import failed', { error: error.message })
      return { success: false, error: error.message }
    }
  }
}
