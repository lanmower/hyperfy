import moment from 'moment'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('WorldSaveManager')
const env = typeof process !== 'undefined' && process.env ? process.env : {}
const SAVE_INTERVAL = parseInt(env.SAVE_INTERVAL || '60', 10)

export class WorldSaveManager {
  constructor(serverNetwork) {
    this.serverNetwork = serverNetwork
  }

  save = async () => {
    const counts = { upsertedBlueprints: 0, upsertedApps: 0, deletedApps: 0 }
    const now = moment().toISOString()
    const dirtyBlueprintIds = Array.from(this.serverNetwork.dirtyBlueprints)
    for (const id of dirtyBlueprintIds) {
      const blueprint = this.serverNetwork.blueprints.get(id)
      if (!blueprint) {
        logger.warn('Blueprint not found in save, skipping', { blueprintId: id })
        this.serverNetwork.dirtyBlueprints.delete(id)
        continue
      }
      try {
        await this.serverNetwork.persistence.saveBlueprint(blueprint.id, blueprint, now, now)
        counts.upsertedBlueprints++
        this.serverNetwork.dirtyBlueprints.delete(id)
      } catch (err) {
        logger.error('Failed to save blueprint', { blueprintId: blueprint.id, error: err.message })
      }
    }
    const dirtyAppIds = Array.from(this.serverNetwork.dirtyApps)
    for (const id of dirtyAppIds) {
      const entity = this.serverNetwork.entities.get(id)
      if (entity) {
        if (entity.data.uploader || entity.data.mover) continue
        try {
          await this.serverNetwork.persistence.saveEntity(entity.data.id, entity.data, now, now)
          counts.upsertedApps++
          this.serverNetwork.dirtyApps.delete(id)
        } catch (err) {
          logger.error('Failed to save entity', { entityId: entity.data.id, error: err.message })
        }
      } else {
        try {
          await this.serverNetwork.persistence.deleteEntity(id)
          counts.deletedApps++
          this.serverNetwork.dirtyApps.delete(id)
        } catch (err) {
          logger.error('Failed to delete entity', { entityId: id, error: err.message })
        }
      }
    }
    const didSave = counts.upsertedBlueprints > 0 || counts.upsertedApps > 0 || counts.deletedApps > 0
    if (didSave) {
      logger.info('World saved', { blueprints: counts.upsertedBlueprints, apps: counts.upsertedApps, deleted: counts.deletedApps })
    }
    this.serverNetwork.saveTimerId = setTimeout(this.save, SAVE_INTERVAL * 1000)
  }

  saveSettings = async () => {
    const data = this.serverNetwork.settings.serialize()
    await this.serverNetwork.persistence.setConfig('settings', JSON.stringify(data))
  }
}
