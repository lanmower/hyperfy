import moment from 'moment'

const env = typeof process !== 'undefined' && process.env ? process.env : {}
const SAVE_INTERVAL = parseInt(env.SAVE_INTERVAL || '60')

export class WorldSaveManager {
  constructor(serverNetwork) {
    this.serverNetwork = serverNetwork
  }

  save = async () => {
    const counts = { upsertedBlueprints: 0, upsertedApps: 0, deletedApps: 0 }
    const now = moment().toISOString()
    for (const id of this.serverNetwork.dirtyBlueprints) {
      const blueprint = this.serverNetwork.blueprints.get(id)
      try {
        await this.serverNetwork.persistence.saveBlueprint(blueprint.id, blueprint, now, now)
        counts.upsertedBlueprints++
        this.serverNetwork.dirtyBlueprints.delete(id)
      } catch (err) {
        console.log(`error saving blueprint: ${blueprint.id}`)
        console.error(err)
      }
    }
    for (const id of this.serverNetwork.dirtyApps) {
      const entity = this.serverNetwork.entities.get(id)
      if (entity) {
        if (entity.data.uploader || entity.data.mover) continue
        try {
          await this.serverNetwork.persistence.saveEntity(entity.data.id, entity.data, now, now)
          counts.upsertedApps++
          this.serverNetwork.dirtyApps.delete(id)
        } catch (err) {
          console.log(`error saving entity: ${entity.data.id}`)
          console.error(err)
        }
      } else {
        await this.serverNetwork.persistence.deleteEntity(id)
        counts.deletedApps++
        this.serverNetwork.dirtyApps.delete(id)
      }
    }
    const didSave = counts.upsertedBlueprints > 0 || counts.upsertedApps > 0 || counts.deletedApps > 0
    if (didSave) {
      console.log(`world saved (${counts.upsertedBlueprints} blueprints, ${counts.upsertedApps} apps, ${counts.deletedApps} deleted)`)
    }
    this.serverNetwork.saveTimerId = setTimeout(this.save, SAVE_INTERVAL * 1000)
  }

  saveSettings = async () => {
    const data = this.serverNetwork.settings.serialize()
    await this.serverNetwork.persistence.setConfig('settings', JSON.stringify(data))
  }
}
