import { uuid } from '../../../utils-client.js'
import { ComponentLogger } from '../../../utils/logging/ComponentLogger.js'
import { BlueprintFactory } from '../../../core/factories/BlueprintFactory.js'

export class BaseSpawner {
  constructor(entitySpawner) {
    this.entitySpawner = entitySpawner
    this.clientBuilder = entitySpawner.clientBuilder
    this.logger = new ComponentLogger(this.constructor.name)
  }

  createBlueprint(overrides = {}) {
    return BlueprintFactory.createBlueprint('app', overrides)
  }

  createEntityData(blueprintId, transform = {}, overrides = {}) {
    const defaults = {
      id: uuid(),
      type: 'app',
      blueprint: blueprintId,
      position: transform.position || [0, 0, 0],
      quaternion: transform.quaternion || [0, 0, 0, 1],
      scale: transform.scale || [1, 1, 1],
      mover: null,
      uploader: this.clientBuilder.network.id,
      pinned: false,
      state: {},
    }
    return { ...defaults, ...overrides }
  }

  async handleUploadWithRollback(files, entity) {
    const promises = files.map(file => this.clientBuilder.network.upload(file))
    try {
      await Promise.all(promises)
      entity.onUploaded()
    } catch (err) {
      this.logger.error('Asset upload failed', { error: err.message })
      entity.destroy()
      throw err
    }
  }
}
