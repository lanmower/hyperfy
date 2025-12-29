import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('StateRecovery')

export class StateRecovery {
  constructor(world) {
    this.world = world
    this.recoveryHistory = []
    this.maxHistory = 50
  }

  async recoverFromBackup(backupId, stateBackup, options = {}) {
    const backup = stateBackup.getBackup(backupId)
    if (!backup) {
      return { success: false, error: 'Backup not found', recoveryId: null }
    }

    const validation = stateBackup.validateBackup(backupId)
    if (!validation.valid) {
      return { success: false, error: validation.error, recoveryId: null }
    }

    const recoveryId = `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    try {
      const results = {
        blueprints: 0,
        entities: 0,
        players: 0,
        errors: []
      }

      if (options.recoverBlueprints !== false) {
        const bpResult = await this.recoverBlueprints(backup.data.blueprints)
        results.blueprints = bpResult.count
        results.errors.push(...bpResult.errors)
      }

      if (options.recoverEntities !== false) {
        const entResult = await this.recoverEntities(backup.data.entities)
        results.entities = entResult.count
        results.errors.push(...entResult.errors)
      }

      if (options.recoverPlayers !== false) {
        const plResult = await this.recoverPlayers(backup.data.players)
        results.players = plResult.count
        results.errors.push(...plResult.errors)
      }

      const duration = Date.now() - startTime
      const recovery = {
        id: recoveryId,
        backupId,
        timestamp: Date.now(),
        duration,
        results,
        success: results.errors.length === 0,
        options
      }

      this.recoveryHistory.push(recovery)
      if (this.recoveryHistory.length > this.maxHistory) {
        this.recoveryHistory.shift()
      }

      logger.info('Recovery completed', {
        recoveryId,
        duration,
        blueprints: results.blueprints,
        entities: results.entities,
        players: results.players,
        errors: results.errors.length
      })

      return { success: true, recoveryId, ...results }
    } catch (error) {
      logger.error('Recovery failed', { error: error.message })
      return { success: false, error: error.message, recoveryId }
    }
  }

  async recoverBlueprints(backupBlueprints) {
    const results = { count: 0, errors: [] }

    try {
      for (const [id, blueprintData] of Object.entries(backupBlueprints || {})) {
        try {
          const existing = this.world.blueprints?.get(id)
          if (!existing) {
            this.world.blueprints?.set(id, {
              id: blueprintData.id,
              name: blueprintData.name,
              model: blueprintData.model,
              script: blueprintData.script,
              props: blueprintData.props || {},
              createdAt: blueprintData.createdAt,
              updatedAt: blueprintData.updatedAt
            })
            results.count++
          }
        } catch (error) {
          results.errors.push(`Blueprint ${id}: ${error.message}`)
        }
      }
    } catch (error) {
      results.errors.push(`Blueprint recovery: ${error.message}`)
    }

    return results
  }

  async recoverEntities(backupEntities) {
    const results = { count: 0, errors: [] }

    try {
      for (const [id, entityData] of Object.entries(backupEntities || {})) {
        try {
          const existing = this.world.entities?.get(id)
          if (!existing) {
            const position = entityData.position ? {
              x: entityData.position[0],
              y: entityData.position[1],
              z: entityData.position[2]
            } : null

            const rotation = entityData.rotation ? {
              x: entityData.rotation[0],
              y: entityData.rotation[1],
              z: entityData.rotation[2],
              w: entityData.rotation[3]
            } : null

            const scale = entityData.scale ? {
              x: entityData.scale[0],
              y: entityData.scale[1],
              z: entityData.scale[2]
            } : null

            const entity = {
              id: entityData.id,
              blueprint: entityData.blueprint,
              position,
              rotation,
              scale,
              mover: entityData.mover,
              mode: entityData.mode,
              createdAt: entityData.createdAt
            }

            this.world.entities?.add(entity)
            results.count++
          }
        } catch (error) {
          results.errors.push(`Entity ${id}: ${error.message}`)
        }
      }
    } catch (error) {
      results.errors.push(`Entity recovery: ${error.message}`)
    }

    return results
  }

  async recoverPlayers(backupPlayers) {
    const results = { count: 0, errors: [] }

    try {
      for (const [id, playerData] of Object.entries(backupPlayers || {})) {
        try {
          const existing = this.world.entities?.get(id)
          if (!existing) {
            const position = playerData.position ? {
              x: playerData.position[0],
              y: playerData.position[1],
              z: playerData.position[2]
            } : null

            const rotation = playerData.rotation ? {
              x: playerData.rotation[0],
              y: playerData.rotation[1],
              z: playerData.rotation[2],
              w: playerData.rotation[3]
            } : null

            const player = {
              id: playerData.id,
              position,
              rotation,
              avatar: playerData.avatar,
              inputMode: playerData.inputMode,
              firstPerson: playerData.firstPerson,
              createdAt: playerData.createdAt,
              isPlayer: true
            }

            this.world.entities?.add(player)
            results.count++
          }
        } catch (error) {
          results.errors.push(`Player ${id}: ${error.message}`)
        }
      }
    } catch (error) {
      results.errors.push(`Player recovery: ${error.message}`)
    }

    return results
  }

  getRecoveryHistory() {
    return [...this.recoveryHistory]
  }

  getRecovery(recoveryId) {
    return this.recoveryHistory.find(r => r.id === recoveryId) || null
  }

  getSuccessfulRecoveries() {
    return this.recoveryHistory.filter(r => r.success)
  }

  getFailedRecoveries() {
    return this.recoveryHistory.filter(r => !r.success)
  }

  getRecoveryStats() {
    const successful = this.recoveryHistory.filter(r => r.success)
    const failed = this.recoveryHistory.filter(r => !r.success)
    const totalDuration = this.recoveryHistory.reduce((sum, r) => sum + r.duration, 0)
    const totalRecovered = successful.reduce((sum, r) => sum + r.results.blueprints + r.results.entities + r.results.players, 0)

    return {
      totalRecoveries: this.recoveryHistory.length,
      successful: successful.length,
      failed: failed.length,
      successRate: this.recoveryHistory.length > 0 ? (successful.length / this.recoveryHistory.length * 100).toFixed(2) + '%' : 'N/A',
      totalDuration,
      averageDuration: this.recoveryHistory.length > 0 ? totalDuration / this.recoveryHistory.length : 0,
      totalRecovered,
      averageRecovered: successful.length > 0 ? totalRecovered / successful.length : 0
    }
  }

  clearHistory() {
    const count = this.recoveryHistory.length
    this.recoveryHistory = []
    logger.info('Recovery history cleared', { count })
    return count
  }
}
